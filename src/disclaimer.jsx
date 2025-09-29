// disclaimer.jsx


import React from "react";


export default function Disclaimer() {
return (
<div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
<div className="max-w-2xl bg-white rounded-xl shadow-md p-6 space-y-4">
<h1 className="text-2xl font-bold text-emerald-700">Disclaimer</h1>
<p className="text-sm text-gray-700">
The information provided on this website is for general informational
purposes only. While we strive to keep listings accurate and
up-to-date, we make no warranties of any kind, express or implied,
about the completeness, accuracy, reliability, suitability, or
availability with respect to the website or the information, services,
or images contained on the website.
</p>
<p className="text-sm text-gray-700">
Any reliance you place on such information is therefore strictly at
your own risk. We are not responsible for any losses or damages in
connection with the use of this website.
</p>
<p className="text-sm text-gray-700">
External links such as Google Maps or WhatsApp are provided for
convenience. We do not endorse or take responsibility for the content
of external websites.
</p>
<p className="text-sm text-gray-700">
By continuing to use this site, you acknowledge and agree to this
disclaimer.
</p>
<a
href="/"
className="inline-block mt-4 text-sm text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
>
Back to Home
</a>
</div>
</div>
);
}