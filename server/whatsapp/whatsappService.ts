import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import { EventEmitter } from "events";
import { commandEngine } from "./commandEngine";
import { rateLimiter } from "./rateLimiter";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface GroupInfo {
  id: string;
  name: string;
  participants: number;
}

export class WhatsAppService extends EventEmitter {
  private static instance: WhatsAppService;
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private isConnecting = false;
  private status: ConnectionStatus = "disconnected";
  private currentQR: string | null = null;
  private managerNumber: string | null = null;
  private autoReplyEnabled = true;

  constructor() {
    super();
  }

  static getInstance(): WhatsAppService {
    if (!this.instance) {
      this.instance = new WhatsAppService();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    console.log("[WhatsApp] Initializing WhatsApp Service...");
    this.managerNumber = process.env.MANAGER_PHONE || null;
    await this.connect();
  }

  getStatus(): { connected: boolean; status: ConnectionStatus; qrCode: string | null; autoReply: boolean } {
    return {
      connected: this.status === "connected",
      status: this.status,
      qrCode: this.currentQR,
      autoReply: this.autoReplyEnabled,
    };
  }

  setAutoReply(enabled: boolean): void {
    this.autoReplyEnabled = enabled;
    console.log(`[WhatsApp] Auto-reply ${enabled ? "enabled" : "disabled"}`);
  }

  async connect(): Promise<string | null> {
    if (this.isConnecting) return null;
    this.isConnecting = true;
    this.status = "connecting";
    this.emit("connecting");

    console.log("[WhatsApp] Starting connection...");

    try {
      const { state, saveCreds } = await useMultiFileAuthState("./auth");
      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, console.log),
        },
        printQRInTerminal: false,
      });

      this.socket = sock;

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.currentQR = qr;
          console.log("\n[WhatsApp] ============ QR CODE ============");
          console.log("[WhatsApp] Scan this QR code with WhatsApp:");
          qrcode.generate(qr, { small: true });
          console.log("[WhatsApp] =====================================\n");
          this.emit("qr", qr);
        }

        if (connection === "open") {
          this.status = "connected";
          this.currentQR = null;
          this.isConnecting = false;
          console.log("[WhatsApp] Connected successfully!");
          this.emit("connected");
        }

        if (connection === "close") {
          this.status = "disconnected";
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log("[WhatsApp] Connection closed:", statusCode);

          if (statusCode !== DisconnectReason.loggedOut) {
            console.log("[WhatsApp] Reconnecting in 10 seconds...");
            this.isConnecting = false;
            setTimeout(() => this.connect(), 10000);
          } else {
            console.log("[WhatsApp] Logged out — Scan QR to reconnect");
            this.isConnecting = false;
            this.emit("disconnected");
          }
        }
      });

      sock.ev.on("messages.upsert", async (msgUpdate) => {
        const msg = msgUpdate.messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid!;
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          "";

        console.log("[WhatsApp] Message from", sender, ":", text);
        this.emit("message", { sender, text, msg });

        // Auto-reply if enabled
        if (this.autoReplyEnabled && text.trim()) {
          try {
            const result = await commandEngine.processMessage(sender, text);
            await this.sendMessage(sender, result.response);
          } catch (error) {
            console.error("[WhatsApp] Auto-reply error:", error);
          }
        }
      });

      this.isConnecting = false;
      return this.currentQR;
    } catch (error) {
      console.error("[WhatsApp] Connection error:", error);
      this.isConnecting = false;
      this.status = "disconnected";
      
      // Retry after error
      console.log("[WhatsApp] Retrying in 15 seconds...");
      setTimeout(() => this.connect(), 15000);
      
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        await this.socket.logout();
      } catch (e) {
        // Ignore logout errors
      }
      this.socket = null;
      this.status = "disconnected";
      this.currentQR = null;
      console.log("[WhatsApp] Disconnected");
      this.emit("disconnected");
    }
  }

  async sendMessage(jid: string, text: string): Promise<boolean> {
    if (!this.socket || this.status !== "connected") {
      console.warn("[WhatsApp] Cannot send - not connected");
      return false;
    }

    // Check rate limit
    const rateCheck = rateLimiter.canSend(jid);
    if (!rateCheck.allowed) {
      console.warn("[WhatsApp] Rate limited:", rateCheck.reason);
      return false;
    }

    try {
      await this.socket.sendMessage(jid, { text });
      rateLimiter.recordSent(jid);
      console.log("[WhatsApp] Sent to", jid);
      return true;
    } catch (error) {
      console.error("[WhatsApp] Send error:", error);
      return false;
    }
  }

  async sendToManager(message: string): Promise<boolean> {
    if (!this.managerNumber) {
      console.warn("[WhatsApp] Manager number not configured");
      return false;
    }
    const jid = this.managerNumber.includes("@s.whatsapp.net")
      ? this.managerNumber
      : `${this.managerNumber}@s.whatsapp.net`;
    return this.sendMessage(jid, message);
  }

  async sendMessageToGroup(groupName: string, message: string): Promise<boolean> {
    if (!this.socket || this.status !== "connected") {
      return false;
    }

    const groups = await this.getGroups();
    const group = groups.find(
      (g) => g.name.toLowerCase() === groupName.toLowerCase()
    );

    if (!group) {
      console.warn(`[WhatsApp] Group "${groupName}" not found`);
      return false;
    }

    return this.sendMessage(group.id, message);
  }

  async getGroups(): Promise<GroupInfo[]> {
    if (!this.socket || this.status !== "connected") {
      return [];
    }

    try {
      const groups = await this.socket.groupFetchAllParticipating();
      return Object.entries(groups).map(([id, metadata]) => ({
        id,
        name: metadata.subject || "Unknown",
        participants: metadata.participants?.length || 0,
      }));
    } catch (error) {
      console.error("[WhatsApp] Failed to fetch groups:", error);
      return [];
    }
  }

  async reply(jid: string, text: string): Promise<boolean> {
    return this.sendMessage(jid, text);
  }

  isConnected(): boolean {
    return this.status === "connected";
  }

  getCurrentQR(): string | null {
    return this.currentQR;
  }
}

export function getWhatsAppService(): WhatsAppService {
  return WhatsAppService.getInstance();
}

export const whatsappService = getWhatsAppService();
