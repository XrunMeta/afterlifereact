

export interface Bindings {
  DB: D1Database;

  XRUN_DB?: D1Database;

  KV_CTX: KVNamespace;          
  KV_SHARED: KVNamespace;       
  KV_SHARED_VER: KVNamespace;   
  KV_ONT: KVNamespace;          

  KV_RATE: KVNamespace;
  KV_IDEMPOTENCY: KVNamespace;
  KV_AUTH: KVNamespace;

  R2_MEDIA: R2Bucket;
  R2_ARCHIVE: R2Bucket;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  AUDIT_SECRET: string;         
  ALE_KEK: string;              
  MASTER_ROOT: string;          

  LAZY_ROTATION_ENABLED?: string;  
  LAZY_V2_MIGRATE_ENABLED?: string;  

  ADMIN_BOOTSTRAP_TOKEN?: string;

  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GMAIL_SENDER: string;            

  XRUN_API_URL: string;            

  XRUN_GATEWAY_TOKEN?: string;

  COMPANY_CHARGE_WALLET?: string;  
  COMPANY_GIFT_WALLET?: string;    

  PAYMENT_CURRENCY?: string;       

  GOOGLE_WEB_CLIENT_ID: string;

  WEBAUTHN_RP_ID: string;        
  WEBAUTHN_RP_ORIGIN: string;    

  ENVIRONMENT: "development" | "staging" | "production";
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    userId?: number;
    adminUserId?: number;
    adminRole?: string;
    requestId: string;
  };
};
