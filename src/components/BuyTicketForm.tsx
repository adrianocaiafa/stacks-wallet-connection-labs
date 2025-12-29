import { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { createNetwork } from '@stacks/network';
import { makeContractCall, AnchorMode, uintCV } from '@stacks/transactions';
import { contractAddress, raffleContractName } from '../utils/contract';

export function BuyTicketForm() {
  const { isConnected, address } = useAppKit();
  const [ticketCount, setTicketCount] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userTickets, setUserTickets] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(0.01);

  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!isConnected || !address) {
        setUserTickets(0);
        return;
      }

      try {
        const network = createNetwork('mainnet');
        const { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } = await import('@stacks/transactions');

        const ticketsResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: raffleContractName,
          functionName: 'get-participant-tickets',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: contractAddress,
        });

        const ticketsData = cvToJSON(ticketsResult);
        const count = parseInt(ticketsData.value || '0');
        setUserTickets(count);
      } catch (err) {
        console.error('Erro ao buscar tickets do usuário:', err);
      }
    };

    fetchUserTickets();
    const interval = setInterval(fetchUserTickets, 10000);
    return () => clearInterval(interval);
  }, [isConnected, address]);

  useEffect(() => {
    const fetchTicketPrice = async () => {
      try {
        const network = createNetwork('mainnet');
        const { fetchCallReadOnlyFunction, cvToJSON } = await import('@stacks/transactions');

        const priceResult = await fetchCallReadOnlyFunction({
          contractAddress,
          contractName: raffleContractName,
          functionName: 'get-ticket-price',
          functionArgs: [],
          network,
          senderAddress: contractAddress,
        });

        const priceData = cvToJSON(priceResult);
        // Handle both direct value and nested value formats
        const priceValue = priceData.value !== undefined 
          ? priceData.value 
          : (priceData.type === 'uint' ? priceData : '10000');
        const priceMicroStx = parseInt(String(priceValue || '10000'));
        setTicketPrice(priceMicroStx / 1000000);
      } catch (err) {
        console.error('Erro ao buscar preço do ticket:', err);
      }
    };

    fetchTicketPrice();
  }, []);

  const handleBuyTickets = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    if (ticketCount < 1 || ticketCount > 100) {
      setError('Quantidade de tickets deve ser entre 1 e 100');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSuccess(false);

    try {
      const network = createNetwork('mainnet');
      const totalAmount = ticketCount * ticketPrice * 1000000; // em micro-STX

      const transaction = await makeContractCall({
        contractAddress,
        contractName: raffleContractName,
        functionName: 'buy-ticket',
        functionArgs: [uintCV(ticketCount)],
        senderKey: address, // Será substituído pela assinatura da wallet
        network,
        anchorMode: AnchorMode.Any,
        fee: 1000,
      });

      // TODO: Implementar assinatura via AppKit
      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsExecuting(false);
      return;

      // const signedTx = await signTransaction(transaction);
      // const broadcastResponse = await broadcastTransaction(signedTx, network);

      // if (broadcastResponse.error) {
      //   throw new Error(broadcastResponse.error);
      // }

      // setSuccess(true);
      // setTimeout(() => {
      //   setSuccess(false);
      //   setTicketCount(1);
      // }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao comprar tickets. Tente novamente.');
    } finally {
      setIsExecuting(false);
    }
  };

  const totalCost = ticketCount * ticketPrice;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Comprar Tickets</h3>

      {userTickets > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Seus tickets no round atual: <span className="font-semibold text-blue-600">{userTickets}</span>
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantidade de tickets
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
            disabled={ticketCount <= 1}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <input
            id="ticket-count"
            type="number"
            min="1"
            max="100"
            value={ticketCount}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              setTicketCount(Math.min(100, Math.max(1, value)));
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => setTicketCount(Math.min(100, ticketCount + 1))}
            disabled={ticketCount >= 100}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Máximo: 100 tickets por transação</p>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Preço por ticket:</span>
          <span className="font-semibold">{ticketPrice.toFixed(6)} STX</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total:</span>
          <span className="text-xl font-bold text-green-600">{totalCost.toFixed(6)} STX</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-800 text-sm">Tickets comprados com sucesso! 🎉</p>
        </div>
      )}

      <button
        onClick={handleBuyTickets}
        disabled={isExecuting || !isConnected}
        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {isExecuting ? 'Processando...' : `Comprar ${ticketCount} ${ticketCount === 1 ? 'Ticket' : 'Tickets'}`}
      </button>

      {!isConnected && (
        <p className="mt-3 text-center text-sm text-gray-500">
          Conecte sua carteira para comprar tickets
        </p>
      )}
    </div>
  );
}

