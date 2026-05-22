"use client";

export default function PrivateJobsFaqs() {
 const faqs = [
 { 
 q:"Rojgar Suvidha direct jobs kya hain aur inpar safe kaise apply karein?", 
 a:"Direct jobs humare experts aur verified corporate partners dwara curate kiye jaate hain. Aap hamari signature 'Apply For Me' premium service ke zariye iske application form ko bina kisi galti ke 100% correct fill karwa sakte hain."
 },
 { 
 q:"Kya partner MNC job listings safe hoti hain?", 
 a:"Jooble API se aney wali partner openings generic feed aggregator par aati hain. Hum filter lagakar bulk-spam clean karte hain, par hum humesha recommend karte hain ki kisi bhi private company ke job interview ke liye kabhi bhi kisi ko ek rupaya bhi training fee ya security fees na dein. Direct companies 100% free hire karti hain."
 },
 { 
 q:"Work From Home (WFH) jobs ke liye qualification kya hoti hai?", 
 a:"Zyadatar telecalling, data entry aur support jobs ke liye minimum 12th Pass ya Graduation qualification mangi jaati hai. Computer and Internet connection hona zaroori hota hai."
 },
 { 
 q:"Rojgar Suvidha Resume Builder free hai?", 
 a:"Haan, humara digital ATS-friendly resume builder candidates ke liye bilkul free hai taaki aap direct HRs ko professional CV submit kar sakein."
 }
 ];

 return (
 <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8">
 <div className="prose max-w-none">
 <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4">
 Verified Private Sector Jobs Portal in India
 </h2>
 <p className="text-sm text-gray-600 mb-6 leading-relaxed">
 Kayi baar candidates private sector jobs (jaise Data Entry, WFH Customer Support ya office jobs) dhoondhte waqt fake consultants aur fraud offers ka shikar ban jaate hain jo training fees ke naam par paise thagte hain. <strong>Rojgar Suvidha</strong> ka mukhy maksad aapko in scams se bachana aur direct HR hiring links provide karna hai.
 </p>
 
 <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
 Frequently Asked Questions (FAQs)
 </h3>
 
 <div className="space-y-4">
 {faqs.map((faq, idx) => (
 <div 
 key={idx} 
 className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50"
 >
 <h4 className="font-bold text-gray-900 text-sm">
 {faq.q}
 </h4>
 <p className="text-xs text-gray-500 mt-2 leading-relaxed">
 {faq.a}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
