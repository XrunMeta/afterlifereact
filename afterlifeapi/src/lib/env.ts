

export interface Bindings {
  DB: D1Database;

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

  ADMIN_BOOTSTRAP_TOKEN?: string;

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
