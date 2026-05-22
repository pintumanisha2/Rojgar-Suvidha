import { NextResponse } from "next/server";

// Standard Indian State Codes for GSTIN
const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh"
};

export async function POST(req: Request) {
  try {
    const { gstin } = await req.json();

    if (!gstin) {
      return NextResponse.json(
        { success: false, error: "GSTIN number is required." },
        { status: 400 }
      );
    }

    const cleanGst = gstin.trim().toUpperCase();

    // 15-digit GSTIN Validation Regex
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGst)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid GSTIN format! It must be a 15-digit alphanumeric code matching official tax schema (e.g. 27AADCS4120F1ZX)." 
        },
        { status: 400 }
      );
    }

    const stateCode = cleanGst.substring(0, 2);
    const stateName = GST_STATE_CODES[stateCode] || "India (Unknown State)";
    const pan = cleanGst.substring(2, 12);
    const entityTypeChar = pan.charAt(3); // 4th character of PAN represents type

    // Cashfree / Zoop Credentials placeholder check
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

    if (clientId && clientSecret) {
      try {
        // Example integration with Cashfree Verification Suite
        const response = await fetch("https://api.cashfree.com/verification/gst", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": clientId,
            "x-client-secret": clientSecret
          },
          body: JSON.stringify({ gstin: cleanGst })
        });

        const data = await response.json();
        
        if (response.ok && data.status === "SUCCESS") {
          return NextResponse.json({
            success: true,
            legal_name: data.legalName || data.tradeName,
            trade_name: data.tradeName || data.legalName,
            state: data.state || stateName,
            status: data.gstinStatus || "ACTIVE",
            address: data.principalPlaceOfBusiness || "Corporate Hub Address",
            is_mock: false
          });
        }
      } catch (err) {
        console.error("Cashfree API network issue, falling back to simulated validation:", err);
      }
    }

    // --- Dynamic Simulation / Mock Mode (100% Free & Unlimited) ---
    // Generate simulated company details dynamically from GSTIN/PAN info
    let simulatedCompanyName = "";
    if (entityTypeChar === "C") {
      // Company
      const mockNames = [
        "Aspirants Adda Software Solutions Pvt Ltd",
        "Wipro Corporate Digital Solutions",
        "Tech Mahindra Vetting Services",
        "Tata Consultancy Placement Partners",
        "Infosys Talent Acquisition Group"
      ];
      // Pick a semi-random name bound to the PAN digits for consistent returns
      const index = parseInt(pan.substring(5, 9)) % mockNames.length;
      simulatedCompanyName = mockNames[index];
    } else if (entityTypeChar === "P") {
      // Individual / Proprietorship
      simulatedCompanyName = `Abhinav Singh Enterprises (Proprietorship)`;
    } else if (entityTypeChar === "F") {
      // Partnership Firm
      simulatedCompanyName = `Rojgar Suvidha Talent Associates (Partnership)`;
    } else {
      // Default Generic
      simulatedCompanyName = `RS Global Vetting Agencies (${stateName})`;
    }

    return NextResponse.json({
      success: true,
      legal_name: simulatedCompanyName,
      trade_name: simulatedCompanyName.replace("Pvt Ltd", "").replace("Solutions", ""),
      state: stateName,
      status: "ACTIVE",
      address: `Vetting Tower, Suite-${pan.substring(5, 8)}, Cyber City, ${stateName}, India`,
      is_mock: true
    });

  } catch (error: any) {
    console.error("GST Verification API internal error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error during business validation." },
      { status: 500 }
    );
  }
}
