export const createCorsHeaders = () =>
  ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  }) as const;

export const createResponse = (data: unknown, status = 200) =>
  new Response(data ? JSON.stringify(data) : null, {
    status,
    headers: createCorsHeaders(),
  });

export const isValidMethod = (method: string): method is "GET" | "OPTIONS" =>
  method === "GET" || method === "OPTIONS";
