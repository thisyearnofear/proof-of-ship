import Link from 'next/link';

export default function About() {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">About Proof Of Ship Tracker</h1>
      <p className="mb-4 text-gray-700">
        <b>Proof Of Ship Tracker</b> is a minimal dashboard for tracking, comparing, and exploring the progress of Celo Proof Of Ship hackathon projects. It visualizes commit activity, contributions, and will soon support milestone insights and prediction markets.
      </p>
      <h2 className="text-xl font-semibold mb-2 mt-6">FAQ</h2>
      <ul className="mb-4 text-gray-700 list-disc pl-6">
        <li><b>What is this?</b> A dashboard to track open-source Celo hackathon projects and their progress.</li>
        <li><b>Who is it for?</b> Developers, community, and anyone interested in Celo project growth.</li>
        <li><b>What’s next?</b> More analytics, milestone tracking, and prediction markets.</li>
      </ul>
      <h2 className="text-xl font-semibold mb-2 mt-6">Learn More</h2>
      <ul className="mb-4 text-blue-700 list-disc pl-6">
        <li><a href="https://docs.celo.org/what-is-celo" target="_blank" rel="noopener noreferrer">What is Celo?</a></li>
        <li><a href="https://docs.gap.karmahq.xyz/how-to-guides/integrations/celo-proof-of-ship" target="_blank" rel="noopener noreferrer">Celo Proof Of Ship</a></li>
      </ul>
      <h2 className="text-xl font-semibold mb-2 mt-6">Projects</h2>
      <div className="mb-2">
        <div className="font-semibold mt-2">Season 1</div>
        <ul className="list-disc pl-6 text-blue-700">
          <li><a href="https://github.com/3-Wheeler-Bike-Club" target="_blank" rel="noopener noreferrer">3 Wheeler Bike Club</a></li>
          <li><a href="https://github.com/Olisehgenesis/AkiliAI" target="_blank" rel="noopener noreferrer">AkiliAI</a></li>
          <li><a href="https://github.com/Muhindo-Galien/celo-eliza" target="_blank" rel="noopener noreferrer">OptiFai</a></li>
          <li><a href="https://github.com/nyfaapp/celo-nyfa-app" target="_blank" rel="noopener noreferrer">Nyfa App</a></li>
          <li><a href="https://github.com/gabrieltemtsen/jazmeen" target="_blank" rel="noopener noreferrer">Jazmeen</a></li>
        </ul>
        <div className="font-semibold mt-4">Season 2</div>
        <ul className="list-disc pl-6 text-blue-700">
          <li><a href="https://github.com/Olisehgenesis/sovereign-seas" target="_blank" rel="noopener noreferrer">Sovseas</a></li>
          <li><a href="https://github.com/SergioFinix/DARVS_CELO" target="_blank" rel="noopener noreferrer">DARVS</a></li>
          <li><a href="https://github.com/0xOucan/celo-mind-dn" target="_blank" rel="noopener noreferrer">CeloMΔIND</a></li>
          <li><a href="https://github.com/andrewkimjoseph/canvassing-participant" target="_blank" rel="noopener noreferrer">Canvassing</a></li>
          <li><a href="https://github.com/Kanasjnr/Subpay" target="_blank" rel="noopener noreferrer">Subpay</a></li>
        </ul>
      </div>
      <h2 className="text-xl font-semibold mb-2 mt-6">Connect</h2>
      <ul className="mb-2 text-blue-700 list-disc pl-6">
        <li><a href="https://github.com/thisyearnofear/POS-dashboard" target="_blank" rel="noopener noreferrer">Dashboard Source Code</a></li>
        {/* Add more links as needed */}
      </ul>
    </div>
  );
}
