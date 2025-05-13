import React from "react";
import { NebulaTest } from "@/components";

/**
 * Test page for Nebula API integration
 */
export default function NebulaTestPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nebula API Integration Test</h1>
      <p className="mb-6 text-gray-600">
        This page allows you to test the Thirdweb Nebula API integration with
        different contract addresses. Enter a contract address and select the
        data types you want to fetch.
      </p>

      <NebulaTest />

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">
          Sample Contract Addresses
        </h2>
        <p className="mb-2 text-sm text-gray-600">
          You can use these sample contract addresses for testing:
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>
            <strong>Celo cUSD:</strong>{" "}
            0x765DE816845861e75A25fCA122bb6898B8B1282a
          </li>
          <li>
            <strong>Celo (Native Token):</strong>{" "}
            0x471EcE3750Da237f93B8E339c536989b8978a438
          </li>
          <li>
            <strong>Jazmeen Contract:</strong>{" "}
            0xe13F9c2C819001fd5D345b32Cf2D4Be67105c4D4
          </li>
          <li>
            <strong>Subpay Testnet Contract:</strong>{" "}
            0x1D0CB90Feb6eb94AeCC3aCBF9C958D3409916831
          </li>
        </ul>
      </div>
    </div>
  );
}
