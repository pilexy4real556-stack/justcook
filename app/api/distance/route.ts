import { NextResponse } from "next/server";

const SHOP_ADDRESS = "148 Ashley Road, St Paul's, Bristol BS6 5PA, UK";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;

    console.log("Received address:", address);

    if (!address) {
      return NextResponse.json(
        { error: "Address required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API key missing");
      return NextResponse.json(
        { error: "Google Maps API key missing" },
        { status: 500 }
      );
    }

    const destinationNormalized =
      address.toLowerCase().includes("uk") ? address : `${address}, UK`;

    const origin = encodeURIComponent(SHOP_ADDRESS);
    const dest = encodeURIComponent(destinationNormalized);

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&units=imperial&key=${apiKey}`;

    console.log("Google API URL:", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("Google API Response:", JSON.stringify(data, null, 2));

    if (
      data.status !== "OK" ||
      data.rows[0].elements[0].status !== "OK"
    ) {
      console.error("Distance calculation failed:", data);
      return NextResponse.json(
        { error: "Distance calculation failed" },
        { status: 400 }
      );
    }

    const meters = data.rows[0].elements[0].distance.value;
    const miles = meters / 1609.34;

    return NextResponse.json({
      distanceMiles: Number(miles.toFixed(2)),
      originResolved: data.origin_addresses?.[0] ?? null,
      destinationResolved: data.destination_addresses?.[0] ?? null,
      distanceText: data.rows?.[0]?.elements?.[0]?.distance?.text ?? null,
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
