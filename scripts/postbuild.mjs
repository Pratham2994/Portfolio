// The host serves 404.html for any address that is not a built page. The app then starts
// there and shows its own "not on the wall" page, with a real 404 status.
import { copyFileSync } from 'node:fs';

copyFileSync('build/client/__spa-fallback.html', 'build/client/404.html');
