import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Web3 } from "web3";
import { Buffer } from "buffer";
import './styles.css'; // Make sure to import your CSS file
import { disconnect } from "process";

const { CoinFlipGameABI } = require("../ContractABI/CoinFlipGameContract_ABI.json")
const { StandardTokenABI } = require("../ContractABI/StandardToken_ABI.json")

const GameComponent = () => {
  const { userId } = useParams();

  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [etherBalance, setEtherBalance] = useState('');
  const [tokenBalance, setTokenBalance] = useState('');
  // const [userId, setUserId] = useState(0);

  const tokenContractAddress = process.env.REACT_APP_TOKEN_ADDRESS;
  const gameContractAddress = process.env.REACT_APP_GAME_ADDRESS;
  const web3Instance = new Web3(window.ethereum);
  const tokenContractInstance = new web3Instance.eth.Contract(StandardTokenABI, tokenContractAddress);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          console.log('Already connected:', accounts[0]);
          setAddress(accounts[0]);
          setConnected(true);
          return;
        }

        // If not connected, proceed with connection
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x5',
              chainName: 'Goerli Testnet',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://rpc.goerli.eth.gateway.fm'],
              blockExplorerUrls: ['https://goerli.etherscan.io/'],
            },
          ],
        });

        const newAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(newAccounts[0]);
        setConnected(true);
      } catch (error) {
        if (error.code === 4001) {
          console.log('Wallet connection was canceled by the user.');
        } else {
          console.error('Error connecting to wallet:', error);
        }
      }
    } else {
      alert('Install MetaMask extension!');
    }
  };

  const disconnectWallet = async () => {
    if (window.ethereum) {
      try {
        // Hide connected section
        const sectionConnected = document.getElementById('section-connected');
        sectionConnected.classList = 'hidden';
        setConnected(false);
        setAddress(null);
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }
  };

  const getBalances = async (web3Instance, tokenContract) => {

    if (web3Instance && address && tokenContract) {
      try {
        const etherBalance = await web3Instance.eth.getBalance(address);
        const tokenBalance = await tokenContract.methods.balanceOf(address).call();
        setEtherBalance(etherBalance);
        setTokenBalance(tokenBalance);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    }
  };

  async function sendTransaction() {
    if (userId === 0) return;

    // Get the user's selected account
    // const accounts = await web3.eth.getAccounts();
    const userAccount = address;

    // Create a contract instance
    console.log(gameContractAddress)
    const gameContractInstance = new web3Instance.eth.Contract(CoinFlipGameABI, gameContractAddress);
    console.log(gameContractInstance)
    const betAmountValue = await gameContractInstance.methods.betAmount().call();
    
    alert(betAmountValue)
    console.log(betAmountValue, "betAmount")
    // console.log(betAmount, "betAmount")
    // const betAmountWei = web3Instance.utils.toWei((betAmount * 10 ** 18).toString(), 'wei');
    // console.log(betAmountWei, "betamountwei")
    // Sign and send the transaction
    try {
      const ApprovalResponse = await tokenContractInstance.methods.approve(gameContractAddress, betAmountValue.toString()).send({ from: userAccount });
      console.log('Approve Transaction Hash:', ApprovalResponse.transactionHash)

      // Send Token to Gameplay Function on Game Contract
      const transactionResponse = await gameContractInstance.methods.playGame(userId).send({ from: userAccount, gasPrice: 3000000 });
      console.log('Transaction hash:', transactionResponse.transactionHash);

      // Close the current window or tab
      window.close();
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }

  // const playGame = async (amount) => {
  //   if (!web3) {
  //     console.error("Web3 provider not available.");
  //     return;
  //   }

  //   try {
  //     const gameContract = new web3.eth.Contract(CoinFlipGameABI, gameContractAddress);
  //     await gameContract.methods.playgame(amount).send({ from: address });
  //     console.log("Game played successfully.");
  //   } catch (error) {
  //     console.error("Error playing game:", error);
  //   }
  // };

  useEffect(() => {
    if (!connected) {
      connectWallet();
    } else {
      getBalances(web3Instance, tokenContractInstance);
      // sendTransaction();
    }
  }, [connected]);

  return (
    <div className="token-game-container">
      <h1 style={{ color: 'white', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>SCROTO HUNT GAME</h1>
      <div className="button-container">
        {!connected ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <div className="account-info">
            <p className="account-title">Connected to Account: <b>{address}</b></p>
            <p className="balance">Ether Balance: {web3Instance ? web3Instance.utils.fromWei(etherBalance, 'ether') : <span className="loading">Loading...</span>}</p>
            <p className="balance">Token Balance: {web3Instance ? web3Instance.utils.fromWei(tokenBalance, 'ether') : <span className="loading">Loading...</span>}</p>
            <button onClick={sendTransaction}>Scroto</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameComponent;