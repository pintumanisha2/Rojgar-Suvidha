export interface ServiceContent {
  title: string;
  hindiTitle: string;
  description: string;
  benefits: string[];
  steps: string[];
  faqs: { q: string; a: string }[];
}

export const SERVICE_INFO_DB: Record<string, ServiceContent> = {
  "pan-new": {
    title: "Apply New PAN Card Online",
    hindiTitle: "नया पैन कार्ड ऑनलाइन बनाएं",
    description: "A Permanent Account Number (PAN) is a crucial 10-digit alphanumeric identifier issued by the Income Tax Department of India. It is mandatory for financial tasks such as opening bank accounts, receiving salary, filing tax returns, and investing. Our digital e-Suvidha portal enables you to apply for a fresh PAN card online safely and securely without going to a physical cyber cafe.",
    benefits: [
      "Mandatory for all bank accounts and cash transactions above ₹50,000.",
      "Serves as a government-authorized photo identity proof across India.",
      "Necessary for filing Income Tax Returns (ITR).",
      "Required for business registration, GST applications, and loans."
    ],
    steps: [
      "Provide your basic personal details (Aadhaar Name, Father's Name, Date of Birth).",
      "Upload clear photos of your Aadhaar Card, Passport Size Photo, and Signature.",
      "Complete the nominal processing payment securely via UPI, Card, or Netbanking.",
      "Our tax experts will verify and submit your application to NSDL/UTIITSL.",
      "Your digital e-PAN Card is emailed in 3-5 days. The physical card is delivered to your Aadhaar address by speed post in 10-15 days."
    ],
    faqs: [
      { q: "What documents are required for a new PAN card?", a: "You only need a valid Aadhaar Card (with correct date of birth), a recent passport-sized photograph, and a digital copy of your signature on white paper." },
      { q: "Can minors apply for a PAN Card?", a: "Yes, minor children can apply. In this case, parent's Aadhaar card and signature are required as Representative Assesse." },
      { q: "How will I receive my physical PAN Card?", a: "The Income Tax Department prints and dispatches the card via India Post (Speed Post) directly to the address linked with your Aadhaar card." }
    ]
  },
  "pan-correction": {
    title: "PAN Card Correction Online (Name, DOB & Photo)",
    hindiTitle: "पैन कार्ड सुधार - नाम, जन्मतिथि और फोटो बदलें",
    description: "Mistakes in your PAN Card can block banking services, ITR filing, and loan processes. If your name, father's name, photograph, signature, or date of birth is incorrect, you can submit a correction request online. We assist in filing NSDL correction forms with precise supporting documentation verification to prevent common rejection pitfalls.",
    benefits: [
      "Align your PAN card details exactly with your Aadhaar Card and 10th marksheet.",
      "Update outdated photographs and digital signatures easily.",
      "Avoid bank account freezing and documentation mismatches during job onboarding.",
      "Smooth out verification processes for passport, visa, and government benefits."
    ],
    steps: [
      "Fill out the application form on the right specifying details that require correction.",
      "Upload your Aadhaar Card, old PAN Card copy, and a proof of correct details (like 10th mark sheet, birth certificate, or marriage certificate).",
      "Pay the service charges and complete the secure payment.",
      "Our team of professionals submits the correction form on the official portal.",
      "The corrected e-PAN is delivered to your email address in 5-7 working days, and the printed card is dispatched shortly after."
    ],
    faqs: [
      { q: "What counts as valid proof for name correction in PAN?", a: "Aadhaar Card, Matriculation (10th) Certificate, Passport, or Gazette Notification can be used as proof for name correction." },
      { q: "Can I correct my father's name online?", a: "Yes, you can correct your father's name spelling mismatch by uploading an official birth certificate or matriculation certificate." },
      { q: "Will my PAN number change after correction?", a: "No, your Permanent Account Number (PAN) will remain exactly the same. Only the printed details and digital records are updated." }
    ]
  },
  "voter-new": {
    title: "New Voter ID Card Online Application",
    hindiTitle: "नया वोटर आईडी कार्ड ऑनलाइन आवेदन",
    description: "The Voter ID Card (EPIC) is issued by the Election Commission of India. It grants you the constitutional right to vote and acts as a primary address and identity proof. If you have turned 18, you can apply online for registration. We check and process Form 6 online on the NVSP portal to guarantee quick approval and EPIC generation.",
    benefits: [
      "Exercises your fundamental right to participate in democratic elections.",
      "Serves as a robust address proof for passport, bank account, and SIM card applications.",
      "Included in the official electoral roll database.",
      "Completely free to use during voting days."
    ],
    steps: [
      "Enter your correct name, age, and parent's name on the application form.",
      "Upload your Aadhaar Card (or age proof like 10th marksheet), a clear passport-sized photo, and address proof.",
      "Pay the processing service fee.",
      "Our experts submit Form 6 on the Election Commission portal.",
      "A Booth Level Officer (BLO) will verify your details, and your digital voter card will be generated in 10-15 days. The physical card is delivered by post."
    ],
    faqs: [
      { q: "What is the minimum age to apply for a Voter ID?", a: "You must be at least 18 years of age on or before the eligibility dates set by the Election Commission." },
      { q: "Can I download my Voter ID online?", a: "Yes, once approved, you can download the digital copy (e-EPIC) from the NVSP portal using your mobile number." },
      { q: "How long does it take for the BLO to verify?", a: "It typically takes 10-20 days depending on your local constituency booth verification schedule." }
    ]
  },
  "aadhaar-pvc": {
    title: "Order Plastic Aadhaar PVC Card Online",
    hindiTitle: "प्लास्टिक आधार पीवीसी कार्ड ऑनलाइन आर्डर करें",
    description: "Paper Aadhaar cards are prone to tearing and water damage. The Unique Identification Authority of India (UIDAI) offers official plastic Aadhaar PVC cards equipped with security features like holograms, micro text, and secure QR codes. We order your official PVC card directly from UIDAI so it reaches your home safely.",
    benefits: [
      "Highly durable, pocket-sized, and waterproof (easy to carry in wallet).",
      "Contains state-of-the-art security features like secure QR code, hologram, and ghost image.",
      "Officially printed and dispatched directly by UIDAI.",
      "Widely accepted everywhere as valid offline identification."
    ],
    steps: [
      "Enter your Aadhaar number and registered mobile number.",
      "Pay the nominal order fee (includes UIDAI fees, printing, and speed post charges).",
      "We process the application through the official UIDAI portal.",
      "Aadhaar card goes to the official security printing press.",
      "UIDAI dispatches the card via Speed Post directly to your registered home address within 7-10 working days."
    ],
    faqs: [
      { q: "Is mobile number link mandatory to order PVC card?", a: "No, we can order the PVC Aadhaar card even if your mobile number is not linked, by using an alternate mobile number for OTP verification." },
      { q: "What are the security features on the PVC card?", a: "It includes a secure QR Code, Hologram, Micro text, Ghost image, Issue Date, and Guilloche Pattern." },
      { q: "How can I track my Aadhaar PVC card order?", a: "Once ordered, we will provide you with the Service Request Number (SRN) to track the dispatch status on UIDAI portal." }
    ]
  },
  "income-cert": {
    title: "Apply Income Certificate Online (Aay Praman Patra)",
    hindiTitle: "आय प्रमाण पत्र ऑनलाइन आवेदन करें",
    description: "An Income Certificate (Aay Praman Patra) is an official document issued by the state government authority (Tehsildar/Revenue Department) certifying the annual income of an individual or family from all sources. It is vital for securing college scholarships, fee concessions, and government subsidy benefits.",
    benefits: [
      "Essential for students applying for state/central scholarship schemes.",
      "Required to qualify for EWS (Economically Weaker Section) reservations.",
      "Mandatory for getting fee waivers in engineering, medical, and government colleges.",
      "Used to obtain subsidies on ration cards, housing schemes, and agricultural benefits."
    ],
    steps: [
      "Provide family income details, applicant's occupation, and address.",
      "Upload Aadhaar Card, Self-Declaration Form, Salary Slip (if available), and Address Proof (Ration Card/Voter ID).",
      "Submit the nominal service fee.",
      "Our team files the application on the respective state e-District portal.",
      "The verified Income Certificate is generated and uploaded to your dashboard in 7 working days."
    ],
    faqs: [
      { q: "What is the validity period of an Income Certificate?", a: "Validity depends on the state government rules, but most states issue Income Certificates valid for 6 months or 1 year from the date of issue." },
      { q: "How is the family income calculated?", a: "It includes income from business, salary, agricultural land, rent, pension, and other domestic resources of all family members." },
      { q: "Can a student apply in their own name?", a: "Usually, the certificate is issued in the name of the parent/guardian since a student does not have an independent income source, but it lists the student's name." }
    ]
  },
  "caste-cert": {
    title: "Apply Caste Certificate Online (Jati Praman Patra)",
    hindiTitle: "जाति प्रमाण पत्र ऑनलाइन आवेदन करें",
    description: "A Caste Certificate (Jati Praman Patra) certifies that an individual belongs to a specific reserved category (SC, ST, OBC, or EBC) as listed under the Indian Constitution. It is issued by the state revenue department and is mandatory to access reservation benefits in jobs, education, and government programs.",
    benefits: [
      "Avail relaxation in cut-off marks and age limits in state and central government jobs.",
      "Secure reserved seats in schools, colleges, and central universities (like DU, IITs, AIIMS).",
      "Access specialized welfare schemes, subsidized loans, and educational grants.",
      "Lifetime validity in most cases (some OBC-NCL certificates require yearly updates)."
    ],
    steps: [
      "Select your category (SC/ST/OBC) and state sub-caste name.",
      "Upload Aadhaar Card, Domicile certificate, Self-Declaration, and copy of caste proof of father or relative.",
      "Pay the service charges.",
      "Our team processes it through the state e-District portal.",
      "The official certified Caste Certificate is delivered to your user panel in 10-15 working days."
    ],
    faqs: [
      { q: "What is the difference between State and Central Caste Certificate?", a: "State certificates are valid for reservation benefits within that specific state, whereas Central certificates (in English format) are required for Central Government jobs (like SSC, UPSC, Railway) and admissions in Central colleges." },
      { q: "What if I do not have a father's caste certificate?", a: "You can submit alternative documents like land registry papers listing the caste, school leaving certificates of relatives, or family tree verification from the village head (Gram Pradhan)." },
      { q: "Does OBC non-creamy layer certificate expire?", a: "Yes, OBC Non-Creamy Layer (OBC-NCL) certificates depend on annual household income, so they must be updated every financial year." }
    ]
  },
  "domicile-cert": {
    title: "Apply Domicile Certificate Online (Niwas Praman Patra)",
    hindiTitle: "निवास प्रमाण पत्र ऑनलाइन आवेदन करें",
    description: "A Domicile Certificate (Niwas/Awasiya Praman Patra) is a document that certifies that a person is a permanent resident of a particular state or union territory. It is issued by the state revenue authority and is essential for claiming local residency quotas in state recruitments and educational institutions.",
    benefits: [
      "Mandatory for claiming state residency quota seats in engineering/medical admissions.",
      "Required for state government jobs (like state police, PCS, state boards) which are restricted to local residents.",
      "Crucial for local resident welfare schemes, pensions, and state scholarships.",
      "Acts as a definitive official address verification proof."
    ],
    steps: [
      "Enter your permanent address details and duration of stay.",
      "Upload Aadhaar Card, self-declaration form, and residential proof (electricity bill, registry copy, or voter ID).",
      "Pay the nominal form filling fees.",
      "Our team uploads the documents to the official state server.",
      "Following verification by the local Lekhpal/Patwari, your Domicile Certificate is generated in 7 working days."
    ],
    faqs: [
      { q: "Can a person hold domicile certificates of two states?", a: "No, legally a citizen of India can hold a permanent resident domicile certificate for only one state at a time." },
      { q: "What is the validity of a Domicile Certificate?", a: "A permanent Domicile Certificate has lifetime validity unless the individual permanently relocates to another state." },
      { q: "Is a self-declaration mandatory?", a: "Yes, most state portals require a signed self-declaration form confirming that the address details provided are 100% correct." }
    ]
  },
  "pcc": {
    title: "Police Clearance Certificate (PCC) Online Apply",
    hindiTitle: "चरित्र प्रमाण पत्र (PCC) ऑनलाइन आवेदन करें",
    description: "A Character Certificate or Police Clearance Certificate (PCC) is an official document issued by the police department verifying that the applicant has no criminal record. It is frequently requested by private employers, government agencies, passport offices, and foreign visa departments.",
    benefits: [
      "Mandatory for final selection in government department jobs.",
      "Required by private security agencies, corporate offices, and banks during background checks.",
      "Essential for booking passport appointments and visa processing.",
      "Builds trust and is often required for taking up public distribution franchises."
    ],
    steps: [
      "Enter personal details, address history, and purpose of the PCC.",
      "Upload your Aadhaar Card, Passport Size Photo, and Signature.",
      "Complete the payment process.",
      "Our team processes it through the respective state police citizen portal.",
      "You will receive a visit from the local police station officer for address verification, and the certificate will be generated in 10-15 days."
    ],
    faqs: [
      { q: "Does the police officer visit my house?", a: "Yes, local police verification is a standard part of the process. An officer from your local police station will call or visit you to verify your identity and address." },
      { q: "How long is a PCC valid?", a: "Generally, a Police Clearance Certificate is considered valid for 6 months from the date of issue." },
      { q: "What happens if there is an active police case against me?", a: "If you have an active criminal record or pending court cases, the police department may reject the PCC request or list the active records on the certificate." }
    ]
  },
  "eshram": {
    title: "E-Shram Card Registration Online",
    hindiTitle: "ई-श्रम कार्ड ऑनलाइन रजिस्ट्रेशन",
    description: "The Ministry of Labour & Employment launched the e-Shram portal to create a national database of unorganized workers (NDUW). Registering for an e-Shram Card provides worker benefits, pension schemes, and accident insurance coverage under central government schemes. We process your registration accurately to ensure immediate card download.",
    benefits: [
      "Provides free Accidental Insurance cover of ₹2 Lakh under PMSBY.",
      "Direct Benefit Transfer (DBT) of financial aid during emergencies/pandemics.",
      "Priority access to social security welfare schemes launched by central/state governments.",
      "Enables registration in PM-YM (Shram Yogi Maan-dhan) pension scheme."
    ],
    steps: [
      "Provide Aadhaar number and active bank account details for direct benefit transfers.",
      "Enter your primary occupation (tailoring, farming, labor, construction, domestic help).",
      "Pay the service charges.",
      "We complete the OTP registration on the official NDUW portal.",
      "The e-Shram Card containing the unique Universal Account Number (UAN) is generated and sent to you instantly in PDF format."
    ],
    faqs: [
      { q: "Who is eligible to apply for an e-Shram Card?", a: "Any unorganized worker aged between 16-59 years who is not a member of EPFO or ESIC, and is not a taxpayer, is eligible to apply." },
      { q: "Are there any yearly renewal fees?", a: "No, there are no renewal fees. However, workers should update their mobile numbers and bank details yearly if they change." },
      { q: "Is PF account holder eligible?", a: "No, if you have an active EPF (Provident Fund) or ESIC account, you do not qualify as an unorganized worker and cannot register." }
    ]
  },
  "ayushman": {
    title: "Ayushman Card Apply Online (PMJAY)",
    hindiTitle: "आयुष्मान भारत कार्ड ऑनलाइन बनाएं",
    description: "Under the Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY), the Government of India provides free cashless medical treatment cover of up to ₹5 Lakh per family per year at empaneled public and private hospitals. We check your name in the eligibility list and process the card online.",
    benefits: [
      "Cashless and paperless access to healthcare services at empaneled hospitals.",
      "Free medical coverage of up to ₹5,00,000 per family per year.",
      "Covers pre-existing diseases, critical surgeries, diagnostics, and medicines.",
      "Valid across all states in India."
    ],
    steps: [
      "Enter your Aadhaar number and ration card number.",
      "We check your eligibility status in the PMJAY database.",
      "If eligible, we complete the Aadhaar OTP e-KYC verification.",
      "The Ayushman Gold Card request is sent to the health department.",
      "Once approved (usually 24 hours), we download and share your official digital Ayushman Card."
    ],
    faqs: [
      { q: "How can I check if my name is in the Ayushman list?", a: "Submit your Aadhaar card or Ration Card number to us. We will check the official SECC-2011 and Ration Card databases to verify your eligibility." },
      { q: "Is there any age limit to apply?", a: "No, there is no age restriction. All family members listed in the eligibility criteria can get individual cards." },
      { q: "Can I use this card in private hospitals?", a: "Yes, you can use the card at any government hospital and all empaneled private hospitals list listed under PMJAY scheme." }
    ]
  },
  "pf-withdrawal": {
    title: "EPFO PF Withdrawal Form Online (Form 31, 19, 10C)",
    hindiTitle: "पीएफ (PF) निकासी ऑनलाइन फॉर्म - Form 31, 19, 10C",
    description: "Withdrawing your Provident Fund (PF) balance online can be highly complicated. Filing incorrect forms can result in claims getting rejected, leading to months of delays. We guide you through the process, setting up correct forms (Form 31 for advance claims, Form 19 for full settlement, and Form 10C for pension withdrawal) to ensure direct bank transfer.",
    benefits: [
      "Extract emergency funds for medical treatment, home construction, marriage, or education.",
      "100% accurate file upload matching EPFO database details.",
      "Direct bank credit without visiting the employer or EPFO office.",
      "Zero rejection guarantee by matching member details and signatures before submitting."
    ],
    steps: [
      "Provide your UAN (Universal Account Number), Password, and linked Mobile Number.",
      "Upload a copy of your bank passbook/canceled cheque showing clear account number and IFSC code.",
      "Select the claim type (Advance Form 31 or Full Settlement Form 19/10C).",
      "Pay our service charges.",
      "Our EPF experts verify member profile data and submit the claim. The amount is credited directly by EPFO to your bank account within 3-7 days."
    ],
    faqs: [
      { q: "What is the difference between Form 19 and Form 10C?", a: "Form 19 is used to withdraw your accumulated EPF balance (employee + employer share), whereas Form 10C is used to withdraw your pension contribution amount." },
      { q: "How long does it take for the PF amount to be credited?", a: "Once successfully submitted, EPFO processing takes about 3 to 10 working days for the amount to hit your bank account." },
      { q: "Can I withdraw PF while still working?", a: "Yes, you can apply for an advance PF withdrawal under Form 31 for specific reasons like illness, education, marriage, or natural calamities." }
    ]
  },
  "udyam": {
    title: "MSME Udyam Aadhaar Registration Online",
    hindiTitle: "एमएसएमई उद्यम रजिस्ट्रेशन ऑनलाइन",
    description: "Udyam Registration is a free, paperless self-declaration portal for micro, small, and medium enterprises (MSMEs) in India. An official MSME certificate is necessary to access government subsidies, tender allocations, tax exemptions, and collateral-free bank loans. We manage the official MSME portal submission for you.",
    benefits: [
      "Eligible for collateral-free bank loans and lower interest rates.",
      "Get up to 50% discount on patent registration and trademark fees.",
      "Access exclusive central government procurement tenders.",
      "Enjoy concessions on electricity bills and ISO certification fees."
    ],
    steps: [
      "Enter your Aadhaar, PAN card, and business details (Name, address, bank details).",
      "Specify business activity (Manufacturing or Services) and investment size.",
      "Pay the nominal MSME registration service fee.",
      "Our team completes the official registration and documents check.",
      "Your official Udyam Registration Certificate is generated in 2-3 days and shared via email."
    ],
    faqs: [
      { q: "Is GSTIN mandatory for Udyam Registration?", a: "GSTIN is not mandatory for micro-enterprises, but it is required for medium and small-scale businesses. A PAN is mandatory for all." },
      { q: "Does Udyam Certificate expire?", a: "No, once generated, the MSME Udyam Registration Certificate has lifetime validity and does not require periodic renewals." },
      { q: "Can a retail shop apply for Udyam?", a: "Yes, the Ministry of MSME has permitted retail and wholesale traders to register on the Udyam portal to access credit benefits." }
    ]
  },
  "itr-nil": {
    title: "File ITR Online (Nil Return Filing)",
    hindiTitle: "निल इनकम टैक्स रिटर्न (Nil ITR) ऑनलाइन फाइल करें",
    description: "Filing a Nil Income Tax Return (ITR) is crucial even if your annual income is below the taxable threshold (₹7 Lakh under the new tax regime). It serves as legal income proof, which is mandatory for visa applications, high-value bank loans, and scholarships. Our tax professionals will file your ITR-1 Nil return securely.",
    benefits: [
      "Serves as the most authentic official income proof accepted by all banks and lenders.",
      "Mandatory document for obtaining international travel visas.",
      "Helps in quick claim of tax refunds (TDS) deducted on your bank interest.",
      "Builds a clean financial track record which is useful for business owners and freelancers."
    ],
    steps: [
      "Enter your PAN Card, Aadhaar Card, and Bank account details.",
      "Upload Form 16 (if available) or bank statements.",
      "Pay the processing fee.",
      "Our CA/Tax expert reviews your details and files ITR-1 on the e-Filing portal.",
      "Receive the official Income Tax Department acknowledgment (ITR-V) in 3-5 days."
    ],
    faqs: [
      { q: "What is a Nil ITR?", a: "A Nil ITR is an income tax return filed when your total taxable income is below the exemption limit, showing zero tax liability." },
      { q: "Is filing ITR useful for students?", a: "Yes, it serves as proof of source of funds for education loans, visa applications, and is a prerequisite for some high-profile scholarships." },
      { q: "What is the penalty for filing late?", a: "If your income is below the taxable limit, there is no penalty for late filing, but it is best to file before the official deadline (usually July 31st) to maintain a regular track record." }
    ]
  },
  "admit-card": {
    title: "Download Admit Card & Exam Result Service",
    hindiTitle: "प्रवेश पत्र और परीक्षा परिणाम डाउनलोड सेवा",
    description: "Are you facing slow internet issues or struggling to navigate government portals? Downloading admit cards for exams like SSC, UPSC, Railway, Police, or University results can be stressful. Our digital cafe service downloads and prints your official admit card or scorecard, sending a high-quality PDF directly to your WhatsApp.",
    benefits: [
      "Avoid portal crashes and slow page load errors during peak hours.",
      "Get instant assistance if you forget your registration or roll number.",
      "High-quality print-ready PDF sent directly to your mobile/WhatsApp.",
      "Saves you a trip to a local physical cyber cafe."
    ],
    steps: [
      "Enter the Exam Name and your credentials (Registration No/Roll No, Password/DOB).",
      "Pay the nominal cyber cafe service charge (₹30).",
      "Our operators access the official website server.",
      "We locate and download the admit card or result sheet.",
      "The official document is sent as a PDF directly to your registered WhatsApp number within 1-2 hours."
    ],
    faqs: [
      { q: "What if I forgot my registration number?", a: "Do not worry. Enter your full name, father's name, and date of birth in the extra instructions box, and our team will recover it from the portal." },
      { q: "Is my exam login data safe?", a: "Absolutely. Your exam credentials are used only once to access the official portal and are automatically deleted immediately after downloading the file." },
      { q: "Will I get a physical print?", a: "We send you a high-quality PDF. You can show this PDF at any local print shop or use it directly on your phone." }
    ]
  },
  "resume-cv": {
    title: "Professional Resume & CV Making Service",
    hindiTitle: "प्रोफेशनल रेज़्युमे / CV ऑनलाइन बनवाएं",
    description: "A professional, well-formatted resume is your ticket to landing a job interview. Many freshers and experienced professionals struggle with formatting, phrasing skills, and design. Our expert designers create clean, ATS-friendly (Applicant Tracking System) resumes tailored to your career field.",
    benefits: [
      "ATS-friendly templates that pass initial automated recruiter screens.",
      "Clean, modern layouts that highlight key skills and education.",
      "Tailored description phrasing based on your experience level.",
      "Provided in both editable Word format and PDF."
    ],
    steps: [
      "Provide your educational background, experience, skills, and contact details.",
      "Upload a professional passport-sized photograph.",
      "Pay the service charges.",
      "Our resume writer reviews and designs your CV in an optimal layout.",
      "The completed resume is shared on your email/WhatsApp within 24 hours for review and edits."
    ],
    faqs: [
      { q: "What is an ATS-friendly resume?", a: "It is a resume formatted specifically so that Applicant Tracking Systems (software used by HR departments) can easily parse and read your skills and keywords, increasing your call-back rate." },
      { q: "Can I request changes after receiving the draft?", a: "Yes, you get unlimited revision requests within 3 days of delivery to adjust spellings, details, or colors." },
      { q: "What format will I receive the resume in?", a: "We send both a print-ready PDF and a fully editable Microsoft Word (.docx) file so you can update details in the future." }
    ]
  },
  "passport": {
    title: "Apply Passport Appointment Online Booking",
    hindiTitle: "पासपोर्ट अपॉइंटमेंट बुकिंग ऑनलाइन आवेदन",
    description: "Applying for an Indian Passport involves extensive form filling on the Passport Seva portal. Document mismatches or incorrect selections can lead to application cancellation or delay. We handle your online registration, document checks, fee payments, and book your nearest PSK (Passport Seva Kendra) appointment.",
    benefits: [
      "Error-free online form filling ensuring zero rejection at the passport office.",
      "Direct guidance on required documentation to bring to the appointment.",
      "Nearest PSK date booking according to your availability.",
      "Assistance for fresh, renewal, and Tatkaal passport categories."
    ],
    steps: [
      "Fill out the basic details (Name, address, parents' names, educational qualification).",
      "Upload Aadhaar Card, PAN Card, or 10th marksheet for non-ECR verification.",
      "Pay the appointment booking service charges.",
      "Our experts complete the application on the Passport Seva portal and pay the official fee.",
      "We book your appointment slot and share the official receipt (ARN PDF) on your dashboard."
    ],
    faqs: [
      { q: "What documents do I need to bring to the Passport Office?", a: "Generally, you need your Aadhaar Card, PAN Card, 10th Marksheet (for Non-ECR status), and a current bank statement or utility bill as address proof." },
      { q: "What is the difference between Normal and Tatkaal passport?", a: "Normal applications take 15-30 days to process, while Tatkaal passports are processed on high priority and dispatched within 1-3 days after successful PSK appointment." },
      { q: "Do I have to go to the passport office in person?", a: "Yes, you must visit the booked Passport Seva Kendra (PSK) in person for biometric fingerprint scanning, photograph capture, and document verification." }
    ]
  },
  "driving-learner": {
    title: "Learner Driving License Online Apply",
    hindiTitle: "लर्निंग ड्राइविंग लाइसेंस ऑनलाइन आवेदन",
    description: "Getting a Learner Driving License is the first step towards obtaining a permanent driving license in India. The Ministry of Road Transport and Highways (Parivahan Sarathi) allows online application and test taking. We fill the form, upload documents, pay the government fee, and prepare you for the online test.",
    benefits: [
      "No need to visit the local RTO office for form submission.",
      "Expert verification of identity and address proofs.",
      "Get free sample questionnaire/questions to easily pass the online learning license exam.",
      "Valid for 6 months across India."
    ],
    steps: [
      "Select your vehicle type (Motorcycle with gear, Light Motor Vehicle, etc.).",
      "Upload your Aadhaar Card, Age Proof (10th marksheet/birth certificate), and Signature.",
      "Pay the service fee.",
      "Our team submits the application on the Sarathi Parivahan portal.",
      "Once processed, we book your online test slot and share the official syllabus so you can pass the online RTO test easily from home."
    ],
    faqs: [
      { q: "Do I need to visit the RTO office for a Learner License?", a: "No, in most states, the learner license application, document verification, and test are conducted online. You can take the test from your home laptop/mobile." },
      { q: "What is the validity of a Learner License?", a: "A Learner License is valid for exactly 6 months. You can apply for a Permanent Driving License after 30 days from the date of learner issue." },
      { q: "What happens if I fail the online test?", a: "If you fail, you can pay a nominal re-test fee on the Parivahan portal and take the test again after 24 hours." }
    ]
  }
};
