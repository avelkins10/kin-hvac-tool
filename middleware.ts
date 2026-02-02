/**
 * Next.js runs this file automatically. Auth and session refresh live in proxy.
 */
import { proxy, config } from './proxy'

export default proxy
export { config }
