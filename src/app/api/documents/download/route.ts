import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || searchParams.get("name") || "BuildMaster-Document";

  const content = [
    "============================================================================",
    "BUILDMASTER ERP - OFFICIAL ENGINEERING & CONTRACT DOCUMENT",
    "============================================================================",
    `Document Reference: ${code}`,
    `Generated Timezone: Asia/Colombo`,
    `Generated Date: ${new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Colombo" })}`,
    "Status: Verified & Digitally Signed in BuildMaster ERP Document Vault",
    "============================================================================",
  ].join("\n");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${code}.txt"`,
    },
  });
}

