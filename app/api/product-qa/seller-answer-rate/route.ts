/**
 * Seller Answer Rate API Route
 * GET /api/product-qa/seller-answer-rate - Get seller's answer rate
 */

import { NextRequest, NextResponse } from "next/server";
import { ProductQAService } from "@/lib/services/product-qa";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get("seller_id");

    if (!sellerId) {
      return NextResponse.json(
        { error: "seller_id is required" },
        { status: 400 },
      );
    }

    const answerRate = await ProductQAService.getSellerAnswerRate(sellerId);

    return NextResponse.json({ answer_rate: answerRate });
  } catch (error: any) {
    console.error("Error fetching seller answer rate:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch seller answer rate" },
      { status: 500 },
    );
  }
}
