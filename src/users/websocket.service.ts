import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { Bot } from 'grammy';

@Injectable()
export class WebsocketService implements OnModuleInit, OnModuleDestroy {
  private socket: Socket;
  private readonly url = 'https://frontend-api.pump.fun'; // Server URL
  private readonly namespace = '/'; // Adjust namespace if needed
  private isConnected = false;
  private retryDelay = 2000; // Initial delay for reconnection
  private maxRetryDelay = 30000; // Maximum delay for reconnection
  private bot: Bot;
  private readonly chatId = '-1002359821935';

  onModuleInit() {
    this.connect();
    this.initTelegramBot();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    console.log(`Connecting to WebSocket server at ${this.url}${this.namespace}`);
    this.socket = io(`${this.url}${this.namespace}`, {
      transports: ['websocket'],
      path: '/socket.io/', // Path used by Socket.IO
      reconnectionAttempts: Infinity, // Unlimited attempts
      reconnectionDelay: this.retryDelay,
      reconnectionDelayMax: this.maxRetryDelay, // Max delay between reconnections
    });

    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));
    this.socket.on('reconnect_attempt', this.handleReconnectAttempt.bind(this));
    this.socket.on('reconnect_error', this.handleReconnectError.bind(this));
    this.socket.on('reconnect_failed', this.handleReconnectFailed.bind(this));

    // Add event listener for 'tradeCreated'
    // this.socket.on('tradeCreated', this.handleTradeCreated.bind(this));

    // Add event listener for 'newCoinCreated'
    this.socket.on('newCoinCreated', this.handleNewCoinCreated.bind(this));
  }

  private handleConnect() {
    console.log('Connected to WebSocket server');
    this.isConnected = true;
    this.retryDelay = 2000; // Reset retry delay on successful connection
  }

  private handleDisconnect(reason: string) {
    console.error('Disconnected from WebSocket server:', reason);
    this.isConnected = false;
  }

  private handleConnectError(error: Error) {
    console.error('Connection error:', error.message);
    this.isConnected = false;
    console.log('Attempting to reconnect...');
  }

  private handleReconnectAttempt(attempt: number) {
    console.log(`Reconnect attempt #${attempt}`);
  }

  private handleReconnectError(error: Error) {
    console.error('Reconnect error:', error.message);
    this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
  }

  private handleReconnectFailed() {
    console.error('Reconnection failed');
  }


  private async handleNewCoinCreated(data: any) {
    if (data?.data?.subscribe?.data) {
      try {
        const parsedData = JSON.parse(data.data.subscribe.data);
        const payload = parsedData?.payload;
      
        if (payload) {
          const {
            mint,
            name = 'Unknown Name',
            symbol = 'Unknown Symbol',
            description = 'No description provided',
            image_uri = '',
            telegram,
            twitter,
            website,
            virtual_sol_reserves = 'N/A',
            total_supply = 'N/A',
            creator = 'Unknown Creator',
            market_cap = 'N/A',
            usd_market_cap = 'N/A'
          } = payload;
  
          // Convert total_supply to millions
          const totalSupplyInMillions = (total_supply / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          // Format message
          const message = `
  🌱 *${name}* • \`${symbol}\` 🌱
  
  📖 *Description:* **_**${description}**_**
  
  📱 *Socials:*
    ├─ *Telegram:* ${telegram ? `[Link](${telegram})` : 'None'}
    ├─ *Twitter:* ${twitter ? `[Link](${twitter})` : 'None'}
    └─ *Website:* ${website ? `[Link](${website})` : 'None'}
  
  🔒 *Security:*
    ├─ ✅ Mint: Revoked
    ├─ ✅ Freeze: Revoked
    └─ ✅ Update: Revoked
  
  💎 *Tokenomics:*
    ├─ 🏷 *Name:* ${name}
    ├─ 💲 *Symbol:* \`${symbol}\`
    ├─ 💰 *Total Supply:* ${totalSupplyInMillions}
    ├─ 📤 *Tax:* 0%
    └─ 🔷 *Decimals:* 6
  `;
  
          // Send message to Telegram chat
          await this.bot.api.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
        } else {
          console.error('Payload is missing in newCoinCreated data:', data);
        }
      } catch (error) {
        console.error('Failed to parse newCoinCreated event data:', error);
      }
    } else {
      console.error('Unexpected structure in newCoinCreated event data:', data);
    }
  }
  private initTelegramBot() {
    this.bot = new Bot('7384076387:AAH0Cx52a6auoUv8zFd0vPi_-ZyTz0D9Tsw'); // Replace with your Telegram bot token
  }

  // Add the event listener in the `connect` method

  async findAll(): Promise<any> {
    return new Promise((resolve, reject) => {
      const handleFindAll = (data: any) => {
        console.log('Received userList data:', data);
        resolve(data);
        this.socket.off('findAll', handleFindAll);
        this.socket.off('error', handleError);
      };

      const handleError = (error: any) => {
        console.error('Received error:', error);
        reject(error);
        this.socket.off('findAll', handleFindAll);
        this.socket.off('error', handleError);
      };

      this.socket.on('findAll', handleFindAll);
      this.socket.on('error', handleError);

      const emitRequestUserList = () => {
        if (this.isConnected) {
          console.log('Emitting requestUserList event');
          this.socket.emit('requestUserList');
        } else {
          console.log('Socket is not connected, retrying...');
          setTimeout(emitRequestUserList, this.retryDelay);
        }
      };

      emitRequestUserList(); // Initial request
    });
  }


  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}
