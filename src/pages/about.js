import Link from "next/link";

// About page updated to include Stable Station and a call to action for Celo shippers
export default function About() {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">About Proof Of Ship Tracker</h1>
      <p className="mb-4 text-gray-700">
        <b>Proof Of Ship Tracker</b> is a minimal dashboard for tracking,
        comparing, and exploring the progress of Celo Proof Of Ship hackathon
        projects. It visualizes commit activity, contributions, and will soon
        support milestone insights and prediction markets.
      </p>
      <h2 className="text-xl font-semibold mb-2 mt-6">FAQ</h2>
      <ul className="mb-4 text-gray-700 list-disc pl-6">
        <li>
          <b>What is this?</b> A dashboard to track open-source Celo hackathon
          projects and their progress.
        </li>
        <li>
          <b>Who is it for?</b> Developers, community, and anyone interested in
          Celo project growth.
        </li>
        <li>
          <b>What's next?</b> Analytics, milestone tracking, and prediction
          markets.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mb-2 mt-6">Learn More</h2>
      <ul className="mb-4 text-blue-700 list-disc pl-6">
        <li>
          <a
            href="https://docs.celo.org/what-is-celo"
            target="_blank"
            rel="noopener noreferrer"
          >
            What is Celo?
          </a>
        </li>
        <li>
          <a
            href="https://docs.gap.karmahq.xyz/how-to-guides/integrations/celo-proof-of-ship"
            target="_blank"
            rel="noopener noreferrer"
          >
            Celo Proof Of Ship
          </a>
        </li>
        <li>
          <Link href="/shippers" className="text-blue-700">
            View All Projects
          </Link>
        </li>
      </ul>
      <h2 className="text-xl font-semibold mb-2 mt-6">Connect</h2>
      <ul className="mb-2 text-blue-700 list-disc pl-6">
        <li>
          <a
            href="https://github.com/thisyearnofear/POS-dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dashboard Source Code
          </a>
        </li>
        {/* Add more links as needed */}
      </ul>
      <div className="mt-8 p-4 bg-amber-50 border border-amber-300 rounded text-center">
        <span className="font-semibold">Are you shipping on Celo?</span>
        <br />
        Contact Papa to get your project added:
        <br />
        <a
          href="https://hey.xyz/u/papajams"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline"
        >
          hey.xyz/u/papajams
        </a>{" "}
        |
        <a
          href="https://warpcast.com/papa"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline ml-1"
        >
          warpcast.com/papa
        </a>
      </div>
    </div>
  );
}
