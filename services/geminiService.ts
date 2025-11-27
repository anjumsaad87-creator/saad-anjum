import { GoogleGenAI } from "@google/genai";
import { Stats } from '../types';

// NOTE: In a production app, never expose keys on the client.
// However, adhering to the user's "Cloud Edition" structure without a backend,
// and following the guidelines to use process.env.API_KEY (which we simulate or assume exists).
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_GEMINI_KEY_HERE' });

export const generateBusinessInsights = async (stats: Stats, transactions: any[]): Promise<string> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const recentTx = transactions.slice(0, 20).map(t => `${t.date}: ${t.description} (${t.amount})`).join('\n');
    
    const prompt = `
      You are an expert business analyst for a water delivery plant.
      Current Date: ${today}
      
      Data:
      - Lifetime Net Income: ${stats.lifetimeNet}
      - Total Receivables: ${stats.totalReceivable}
      - Recent Transactions:
      ${recentTx}

      Analyze the recent performance. Identify any trends in sales or expenses. 
      Give 3 specific actionable recommendations to improve profitability or collections.
      Keep it concise and professional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this time. Please check your API key.";
  }
};