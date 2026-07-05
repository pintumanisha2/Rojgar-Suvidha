async function test() {
  console.log("Testing live API endpoint...");
  
  const url = "https://www.rojgarsuvidha.com/api/submit-application";
  const payload = {
    amount: 150.00,
    customerName: "Akshat Ansh",
    customerPhone: "9999999999",
    customerEmail: "test@gmail.com",
    formId: "esuvidha-pan-new"
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("Response Status:", response.status);
    console.log("Response OK:", response.ok);
    const text = await response.text();
    console.log("Response Body (Truncated):", text.substring(0, 500));
  } catch (err) {
    console.error("Fetch Exception occurred:", err);
  }
}

test();
