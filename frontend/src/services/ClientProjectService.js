/**
 * @deprecated ClientProjectService.js - Functionality merged into DataService.ts
 * 
 * This file is kept for backward compatibility. Please update imports to:
 * import { submitProject } from '@/services/DataService';
 * 
 * All functionality has been moved to the canonical DataService.ts
 */

// Re-export from canonical DataService.ts
import { submitProject } from './DataService';
export { submitProject };
export default { submitProject };