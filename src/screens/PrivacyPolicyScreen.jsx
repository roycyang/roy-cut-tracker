export default function PrivacyPolicyScreen() {
  return (
    <div className="min-h-screen px-6 py-12 max-w-lg mx-auto prose prose-invert prose-sm">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-400 text-xs mb-6">Last updated: March 2026</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">What We Collect</h2>
      <ul className="text-sm text-gray-300 space-y-1 list-disc ml-4">
        <li>Account info (email, name, avatar from social login)</li>
        <li>Body metrics you enter (weight, goals)</li>
        <li>Meal and supplement tracking data</li>
        <li>Progress photos (if you choose to upload them)</li>
        <li>Usage data (feature interactions, not personal browsing)</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">How We Use It</h2>
      <ul className="text-sm text-gray-300 space-y-1 list-disc ml-4">
        <li>To provide and personalize your cut plan</li>
        <li>To power AI coaching features</li>
        <li>To show your progress in the social feed (only if you opt in)</li>
        <li>To improve the app experience</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">What We Never Do</h2>
      <ul className="text-sm text-gray-300 space-y-1 list-disc ml-4">
        <li>Share your exact weight with other users</li>
        <li>Sell your personal data to third parties</li>
        <li>Show your progress photos without your explicit consent</li>
        <li>Use your data for advertising</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Your Controls</h2>
      <ul className="text-sm text-gray-300 space-y-1 list-disc ml-4">
        <li>Switch between social and private mode anytime</li>
        <li>Choose how progress photos are shared (show, blur face, or private)</li>
        <li>Export your data as CSV</li>
        <li>Delete your account and all data at any time</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Data Storage</h2>
      <p className="text-sm text-gray-300">
        Your data is stored securely on Supabase (hosted on AWS). Photos are stored in encrypted cloud storage.
        We use industry-standard security practices.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Third Parties</h2>
      <ul className="text-sm text-gray-300 space-y-1 list-disc ml-4">
        <li>OpenAI — for AI meal analysis and coaching (your data is not used to train their models)</li>
        <li>Supabase — database and authentication</li>
        <li>RevenueCat — payment processing for coaching subscriptions</li>
        <li>Amazon Associates — affiliate links for supplement recommendations</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Contact</h2>
      <p className="text-sm text-gray-300">
        Questions? Reach out at <span className="text-blue-400">privacy@cutapp.fit</span>
      </p>
    </div>
  );
}
