import { envContext } from '@/lib/Module';
import ModuleManager from '@/lib/ModuleManager';

const contentModules = {
};


new ModuleManager({ env: envContext.content, modules: contentModules as any});
