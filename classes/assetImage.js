import { CoinIconsFromTrustWallet } from "~/const/icon-list";
import { assetFromString } from "@xchainjs/xchain-util";
import { ethers } from 'ethers';

function _setEthIconPath(assetSymbol, assetTicker) {
  const assetAddress = assetSymbol.slice(assetTicker.length + 1);
  const strip0x = assetAddress.substr(2);
  const checkSummedAddress = ethers.utils.getAddress(strip0x);
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checkSummedAddress}/logo.png`;
}

export const AssetImage = (assetStr) => {
  let {ticker, chain, symbol} = assetFromString(assetStr);

  const trustWalletMatch = CoinIconsFromTrustWallet[ticker];

  let iconPath = undefined;
  
  
  if (trustWalletMatch && chain !== "THOR") {
    iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
  } else {
    // Override token icons when not found in trustwallet
    switch (chain) {
      case 'THOR':
        if (ticker != null && ticker == 'RUNE') {
          iconPath =
            'https://raw.githubusercontent.com/asgardex/thorchain_explorer/main/assets/images/thorchain-logo.png';
        } 
        else {
          iconPath =
          'https://raw.githubusercontent.com/asgardex/thorchain_explorer/main/assets/images/thorchain-logo.png';
        }
        break;

      case "BTC":
        iconPath =
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png";
        break;

      case "LTC":
        iconPath =
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/LTC-F07/logo.png";
        break;

      case "BNB":
        if (ticker === "BNB") {
          iconPath =
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png";
        }
        else {
          iconPath =
          `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${symbol}/logo.png`;
        }
        break;

      case "ETH":
        if (symbol !== "ETH") {
          // for ETH tokens
          iconPath = _setEthIconPath(symbol, ticker);

          // getter of icons for eth testnet
          // if (environment.network === "testnet") {
          //   iconPath = getTestnetTokeIconPath(
          //     this.symbol,
          //     this.ticker
          //   );
          // }

          if (ticker === "ALCX") {
            iconPath = "https://etherscan.io/token/images/Alchemix_32.png";
          } 
          else if (ticker === 'TGT') {
            iconPath = "https://app.thorswap.finance/assets/asset-tgt.81fad622.png";
          }
        }
        break;

      case "BCH":
        iconPath =
          "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoincash/info/logo.png";
        break;

      case "DOGE":
        iconPath = 
          "https://app.thorswap.finance/assets/asset-dogecoin.660e86f3.png"
      break;

      case "TERRA":
        if (ticker === 'TERRA' || ticker === 'LUNA')
          iconPath = 
            "https://app.thorswap.finance/assets/asset-luna.82340679.png"
        else if (ticker === 'UST')
          iconPath = 
            "https://app.thorswap.finance/assets/asset-ust.1c0b5be9.png"
      break;

      default:
        break;
    }
  }

  return iconPath;
};
