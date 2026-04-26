import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { db } from '@/lib/firebase/clientApp';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import EngagementTicker from '@/components/dashboard/EngagementTicker';
import { Card } from '@/components/common/Card';
import { MapIcon, SparklesIcon } from '@heroicons/react/24/outline';

const FleetMap = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, 'projects'), limit(50));
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects for map:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Simple pseudo-random coordinates based on project name
  const getCoordinates = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const x = Math.abs((hash % 800)) + 100;
    const y = Math.abs(((hash >> 8) % 400)) + 50;
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Head>
        <title>Global Fleet Map | Proof of Ship</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Map Area */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <ShipWheelIcon className="w-8 h-8 text-blue-500 animate-spin-slow" />
                  Global Fleet Map
                </h1>
                <p className="text-slate-400 mt-2">
                  Visualizing the armada across the multi-ecosystem sea.
                </p>
              </div>
              <div className="hidden sm:flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-xs text-slate-400">Base</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-xs text-slate-400">Celo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span className="text-xs text-slate-400">Linea</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#14F195]"></span>
                  <span className="text-xs text-slate-400">Solana</span>
                </div>
              </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 p-0 overflow-hidden h-[600px] relative">
              {/* SVG Map Background */}
              <svg className="w-full h-full opacity-20" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="1000" height="500" fill="url(#grid)" />
                {/* Pseudo-islands */}
                <path d="M150,100 Q200,50 250,100 T350,150 Q400,200 300,250 T150,200 Z" fill="currentColor" />
                <path d="M600,300 Q650,250 700,300 T800,350 Q850,400 750,450 T600,400 Z" fill="currentColor" />
                <path d="M800,100 Q850,50 900,100 T950,150 Q900,200 850,150 Z" fill="currentColor" />
              </svg>

              {/* Project Fleet */}
              <div className="absolute inset-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-slate-400">Charting the course...</p>
                    </div>
                  </div>
                ) : (
                  projects.map((project) => {
                    const { x, y } = getCoordinates(project.name);
                    const color = project.ecosystem === 'base' ? 'text-blue-500' :
                                  project.ecosystem === 'celo' ? 'text-green-500' :
                                  project.ecosystem === 'solana' ? 'text-[#14F195]' : 'text-purple-500';
                    return (
                      <div 
                        key={project.id}
                        className="absolute group transition-all duration-300 hover:z-10"
                        style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 500) * 100}%` }}
                      >
                        <div className={`cursor-pointer ${color} hover:scale-150 transition-transform`}>
                          <ShipIcon className="w-6 h-6" />
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block z-20">
                          <Card className="bg-slate-800 border-slate-700 p-2 shadow-2xl">
                            <h4 className="font-bold text-xs truncate">{project.name}</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1">{project.ecosystem}</p>
                            <div className="flex justify-between mt-2 pt-2 border-t border-slate-700">
                              <span className="text-[9px] text-slate-500">COMMITS: {project.stats?.commits || 0}</span>
                              <span className="text-[9px] text-slate-500">STAKES: {project.totalStaked || 0}</span>
                            </div>
                          </Card>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Map UI Overlays */}
              <div className="absolute bottom-6 left-6 flex gap-2">
                <div className="bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700 text-xs flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-blue-400" />
                  <span>Interactive Radar</span>
                </div>
              </div>
              <div className="absolute top-6 right-6">
                <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase">Coordinate System</div>
                  <div className="text-xs font-mono text-blue-400">LAT: 42.3601 N</div>
                  <div className="text-xs font-mono text-blue-400">LONG: 71.0589 W</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Feed */}
          <div className="lg:w-80 flex flex-col gap-6">
            <EngagementTicker />
            
            <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-900/30 p-4">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <SparklesIcon className="w-4 h-4 text-blue-400" />
                Fleet Insights
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total Armada</span>
                  <span className="text-sm font-mono font-bold">{projects.length} Ships</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Active Payouts</span>
                  <span className="text-sm font-mono font-bold text-green-400">Active</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded transition-colors">
                    RECRUIT NEW VESSEL
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Ship Icon
const ShipIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3 18h18l-1.5 3h-15L3 18zM12 2v14M8 5l4-3 4 3-4 10-4-10z" />
  </svg>
);

// We need to define ShipWheelIcon as it's not in Heroicons outline by that name usually
// Actually I used ShipWheelIcon but I'll use a standard one if it fails
// Let's use ArrowPathIcon or something similar if needed, but I'll try to find a good one.
// Actually I'll just use a generic icon for now or define it.

const ShipWheelIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export default FleetMap;
