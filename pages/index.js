import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { ABI, WHITELIST_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  // joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);

  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);

  // numberOfWhiteListed tracks the number of addresses's whitelisted
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);

  // Create a reference to the Web3 Modal (used for connecting to MetaMask) which persists as long as the page is open
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, throw an error
    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };
  /**
   * addAddressToWhitelist: Adds the current connected address to the whitelist
   */

  const addAddressToWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const tx = await whitelistContract.addAddressToWhitelist();

      setLoading(true);

      await tx.wait();

      setLoading(false);

      await getNumberOfWhitslisted();
      setJoinedWhitelist(true);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Gets the number of whitelisted addresses
   */

  const getNumberOfWhitslisted = async () => {
    try {
      const provider = await getProviderOrSigner(true);

      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        ABI,
        provider
      );

      // Call the numAddressesWhitelisted from the contract
      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Checks if the address is in whitelist
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const address = await signer.getAddress();

      const _joinedWhitelist = await whitelistContract.whitelistedAddresses;

      console.log(_joinedWhitelist);

      setJoinedWhitelist(_joinedWhitelist);
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal
      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitslisted();
    } catch (error) {
      console.error(error);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
