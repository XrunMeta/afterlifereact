export interface Message {
  id: string;
  senderId: string;
  senderType: "user" | "clone";
  text: string;
  timestamp: string;
}
