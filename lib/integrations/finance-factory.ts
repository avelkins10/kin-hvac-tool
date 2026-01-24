import { IFinanceProvider, FinanceApplicationData, FinanceApplicationResponse } from './finance-provider.interface'
import { LightReachClient } from './lightreach'

// Factory to instantiate the correct finance provider
export class FinanceProviderFactory {
  static createProvider(lenderId: string): IFinanceProvider {
    switch (lenderId.toLowerCase()) {
      case 'lightreach':
        return new LightReachClient()
      // Add more lenders here:
      // case 'synchrony':
      //   return new SynchronyClient()
      // case 'greensky':
      //   return new GreenSkyClient()
      // case 'mosaic':
      //   return new MosaicClient()
      default:
        throw new Error(`Unsupported lender: ${lenderId}`)
    }
  }

  static getAvailableLenders(): string[] {
    return ['lightreach'] // Add more as they're implemented
  }
}
