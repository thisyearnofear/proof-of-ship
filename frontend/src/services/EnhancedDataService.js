/**
 * @deprecated EnhancedDataService.js - Functionality merged into DataService.ts
 * 
 * This file is kept for backward compatibility. Please update imports to:
 * import { enhancedDataService } from '@/services/DataService';
 * 
 * All functionality has been moved to the canonical DataService.ts
 */

// Re-export from canonical DataService.ts
import { enhancedDataService, dataService } from './DataService';
export { enhancedDataService, dataService };
export default enhancedDataService;