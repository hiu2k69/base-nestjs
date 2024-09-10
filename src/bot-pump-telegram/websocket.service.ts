import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { Bot } from 'grammy';
import { format } from 'date-fns';

@Injectable()
export class WebsocketService implements OnModuleInit, OnModuleDestroy {
  private socket: Socket;
  private readonly url = 'https://frontend-api.pump.fun'; // Server URL
  private readonly namespace = '/'; // Adjust namespace if needed
  private isConnected = false;
  private retryDelay = 2000; // Initial delay for reconnection
  private maxRetryDelay = 30000; // Maximum delay for reconnection
  private bot: Bot;
  private bot2: Bot;

  private readonly chatId = '-1002359821935';
  private readonly chatIdTrade = '-1002406434432';


  onModuleInit() {
    this.connect();
    this.initTelegramBot();
    this.initTelegramBotTrade();

  }

  onModuleDestroy() {
    this.disconnect();
  }

  public static formatCurrency(value: any): string {
    if (value === 'N/A') return 'N/A';
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return 'Invalid Value';
    return `$${numberValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    this.socket.on('tradeCreated', this.handleTradeCreated.bind(this));

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

  private async handleTradeCreated(data: any) {
    if (data) {
        try {
            // Parse the payload from the received data
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            const payload = parsedData;
            if (parsedData) {
                const {
                    associated_bonding_curve,
                    bonding_curve,
                    complete,
                    created_timestamp,
                    creator = 'Unknown Creator',
                    description = 'No description provided',
                    image_uri,
                    is_buy, // This field indicates whether it's a buy or sell
                    market_cap = 'N/A',
                    mint,
                    name = 'Unknown Name',
                    sol_amount = 0,
                    symbol = 'Unknown Symbol',
                    telegram,
                    timestamp,
                    token_amount,
                    total_supply = 'N/A',
                    usd_market_cap = 'N/A',
                    user,
                    virtual_sol_reserves,
                    virtual_token_reserves,
                    website,
                } = payload;

                // Format total supply in millions
                const totalSupplyInMillions = (total_supply / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });


                const solAmount90Percent = parseFloat((sol_amount / 10 ** 9).toFixed(4));
                const timestampInMilliseconds = typeof timestamp === 'number' && timestamp < 10000000000 ? timestamp * 1000 : timestamp;
                const formattedDate = format(new Date(timestampInMilliseconds), 'yyyy-MM-dd HH:mm:ss');

                const tradeType = is_buy ? 'Buy' : 'Sell';
                const tradeTypeColor = is_buy ? '🔹' : '🔴';

                // Format message with color
                const message = `
${tradeTypeColor} *${tradeType}: ${name}* • \`${symbol}\` ${tradeTypeColor}

💼 *Creator:* ${creator}

💰 *SOL Amount:* ${solAmount90Percent} SOL

📊 *Tokenomics:*
├─ 🏷 *Name:* ${name}
├─ 💲 *Symbol:* \`${symbol}\`
├─ 💰 *Total Supply:* ${totalSupplyInMillions}
├─ 💵 *Market Cap:* ${WebsocketService.formatCurrency(market_cap)}
└─ 💲 *USD Market Cap:* ${WebsocketService.formatCurrency(usd_market_cap)}



🌐 *Website:* ${website ? website : 'None'}
📱 *Telegram:* ${telegram ? telegram : 'None'}
          
⏰ *Timestamp:* ${formattedDate}

`;
                console.log(solAmount90Percent);
                // Check if SOL amount is >= 5 and log accordingly
                if (solAmount90Percent >= 5) {
                    await this.bot2.api.sendMessage(this.chatIdTrade, message, { parse_mode: 'Markdown',link_preview_options: {
                      is_disabled: true,
                    }});
                    console.log(`🚨 High value trade detected: ${solAmount90Percent} SOL`);
                }
            } else {
                console.error('Payload is missing in tradeCreated data:', data);
            }
        } catch (error) {
            console.error('Failed to parse tradeCreated event data:', error);
        }
    } else {
        console.error('Unexpected structure in tradeCreated event data:', data);
    }
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
          // console.log(twiter,telegram);
          // return false;
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
          await this.bot.api.sendMessage(this.chatId, message, { parse_mode: 'Markdown',link_preview_options: {
            is_disabled: true,
          }});
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
  
  // 🌐 *Market Data:*
  //   ├─ 💸 *Market Cap:* $${market_cap}
  //   └─ 📈 *USD Market Cap:* $${usd_market_cap}
  
  // 📊 *Reserves:*
  //   ├─ 🪙 *Virtual SOL Reserves:* ${virtual_sol_reserves.toLocaleString()}
  //   └─ 🪙 *Real Token Reserves:* ${payload.real_token_reserves.toLocaleString()}
    // 🏠 *Address:* 
    //     \`${mint}\`
  
  private initTelegramBot() {
    this.bot = new Bot('7384076387:AAH0Cx52a6auoUv8zFd0vPi_-ZyTz0D9Tsw'); // Replace with your Telegram bot token
  }

  private initTelegramBotTrade() {
    this.bot2 = new Bot('7546622769:AAGg8U4Ruhj5rNgvtQwRqk9UIKojNDBEm6c'); // Replace with your Telegram bot token for bot2
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
