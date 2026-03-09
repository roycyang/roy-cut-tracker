export default function TermsScreen() {
  return (
    <div className="min-h-screen px-6 py-12 max-w-lg mx-auto prose prose-invert prose-sm">
      <h1 className="text-2xl font-bold mb-6">Terms of Use</h1>
      <p className="text-gray-400 text-xs mb-6">Last updated: March 2026</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Not Medical Advice</h2>
      <p className="text-sm text-gray-300">
        Cut is a fitness tracking tool, not a medical device. The calorie targets, meal plans, and weight
        loss recommendations are general guidance only. Always consult with a healthcare professional before
        starting any diet or exercise program, especially if you have existing health conditions.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Your Account</h2>
      <ul className="text-sm text-gray-300 space-y-1 list-disc ml-4">
        <li>You're responsible for keeping your account secure</li>
        <li>You must be at least 16 years old to use Cut</li>
        <li>One account per person</li>
        <li>Don't share accounts or impersonate others</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Social Features</h2>
      <ul className="text-sm text-gray-300 space-y-1 list-disc ml-4">
        <li>Be encouraging and supportive in the feed</li>
        <li>Don't share others' progress info outside the app</li>
        <li>No harassment, body shaming, or negative comparisons</li>
        <li>We may remove content or accounts that violate community standards</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Coaching Services</h2>
      <ul className="text-sm text-gray-300 space-y-1 list-disc ml-4">
        <li>AI coaching is included free and provides general fitness guidance</li>
        <li>Human coaching is a paid service with no guarantee of specific results</li>
        <li>Coaching is not a substitute for professional medical or nutritional advice</li>
        <li>Subscriptions can be canceled anytime through your App Store settings</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Affiliate Links</h2>
      <p className="text-sm text-gray-300">
        Cut includes Amazon affiliate links for supplement recommendations. We earn a small commission
        on purchases made through these links at no extra cost to you. We only recommend products we
        believe in, and we're transparent about what's essential vs. what's overkill.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Payments & Refunds</h2>
      <p className="text-sm text-gray-300">
        All payments are processed through the App Store. Refund requests should be directed to
        Apple or Google per their respective refund policies.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Limitation of Liability</h2>
      <p className="text-sm text-gray-300">
        Cut is provided "as is" without warranty. We're not liable for any health outcomes,
        data loss, or other damages resulting from use of the app.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Contact</h2>
      <p className="text-sm text-gray-300">
        Questions? Reach out at <span className="text-blue-400">legal@cutapp.fit</span>
      </p>
    </div>
  );
}
