import { Server, Socket } from 'socket.io';
import { ChatMessage } from '@culinary-game/shared';

export class ChatHandlers {
  private messages: ChatMessage[] = [];
  private readonly MAX_MESSAGES = 100;

  constructor(private io: Server) {}

  handleConnection(socket: Socket) {
    socket.on('chat-message', (data: { message: string; username: string; roomId?: string }) => {
      this.handleChatMessage(socket, data);
    });

    socket.on('request-chat-history', (data: { roomId?: string }) => {
      this.handleRequestChatHistory(socket, data.roomId);
    });
  }

  private handleChatMessage(socket: Socket, data: { message: string; username: string; roomId?: string }) {
    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: socket.id,
      username: data.username,
      message: data.message,
      timestamp: new Date(),
      roomId: data.roomId
    };

    // Store message
    this.messages.push(chatMessage);
    
    // Keep only last MAX_MESSAGES
    if (this.messages.length > this.MAX_MESSAGES) {
      this.messages.shift();
    }

    // Broadcast to appropriate room
    if (data.roomId) {
      this.io.to(data.roomId).emit('chat-message', chatMessage);
    } else {
      // Lobby chat
      this.io.to('lobby').emit('chat-message', chatMessage);
    }
  }

  private handleRequestChatHistory(socket: Socket, roomId?: string) {
    const relevantMessages = roomId
      ? this.messages.filter(m => m.roomId === roomId)
      : this.messages.filter(m => !m.roomId);

    // Send messages in chronological order
    const sortedMessages = relevantMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    socket.emit('chat-history', sortedMessages);
  }
}

