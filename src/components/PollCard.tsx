import { useState, useEffect } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, votingSystemContractName } from '../utils/contract';

interface PollOption {
  text: string;
  votes: number;
  percentage: number;
}

interface PollData {
  pollId: number;
  title: string;
  options: PollOption[];
  isOpen: boolean;
  totalVotes: number;
  userVote: number | null;
}

interface PollCardProps {
  pollId: number;
  onVoteSuccess?: () => void;
}

export function PollCard({ pollId, onVoteSuccess }: PollCardProps) {
  const { isConnected, address } = useAppKit();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      setLoading(true);
      try {
        const network = createNetwork('mainnet');

        const [pollResult, userVoteResult] = await Promise.all([
          fetchCallReadOnlyFunction({
            contractAddress,
            contractName: votingSystemContractName,
            functionName: 'get-poll-results',
            functionArgs: [uintCV(pollId)],
            network,
            senderAddress: contractAddress,
          }),
          isConnected && address
            ? fetchCallReadOnlyFunction({
                contractAddress,
                contractName: votingSystemContractName,
                functionName: 'get-user-vote',
                functionArgs: [uintCV(pollId), standardPrincipalCV(address)],
                network,
                senderAddress: contractAddress,
              })
            : Promise.resolve(null),
        ]);

        const pollData = cvToJSON(pollResult);
        const userVoteData = userVoteResult ? cvToJSON(userVoteResult) : null;

        if (pollData.type !== 'none' && pollData.value) {
          const value = pollData.value.value || pollData.value;
          const optionsList = value.options?.value || value.options || [];
          const optionCount = parseInt(String(value['option-count']?.value || value.optionCount?.value || optionsList.length || '0'));

          // Fetch vote counts for each option
          const optionVotesPromises = [];
          for (let i = 0; i < optionCount; i++) {
            optionVotesPromises.push(
              fetchCallReadOnlyFunction({
                contractAddress,
                contractName: votingSystemContractName,
                functionName: 'get-option-votes',
                functionArgs: [uintCV(pollId), uintCV(i)],
                network,
                senderAddress: contractAddress,
              })
            );
          }

          const optionVotesResults = await Promise.all(optionVotesPromises);
          const totalVotes = parseInt(String(value['total-votes']?.value || value.totalVotes?.value || '0'));

          const options: PollOption[] = [];
          for (let i = 0; i < optionCount; i++) {
            const optionText = optionsList[i]?.value || optionsList[i] || '';
            const votesData = cvToJSON(optionVotesResults[i]);
            const votes = parseInt(String(votesData.value || '0'));
            options.push({
              text: String(optionText),
              votes,
              percentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
            });
          }

          let userVote: number | null = null;
          if (userVoteData && userVoteData.type !== 'none' && userVoteData.value) {
            const voteValue = userVoteData.value.value || userVoteData.value;
            userVote = parseInt(String(voteValue['option-index']?.value || voteValue.optionIndex?.value || '0'));
          }

          setPoll({
            pollId,
            title: String(value.title?.value || value.title || ''),
            options,
            isOpen: value['is-open']?.value !== false && value.isOpen !== false,
            totalVotes,
            userVote,
          });
        }
      } catch (err: any) {
        console.error('Erro ao buscar poll:', err);
        setError('Erro ao carregar poll. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
    const interval = setInterval(fetchPoll, 20000); // Atualiza a cada 20 segundos
    return () => clearInterval(interval);
  }, [pollId, isConnected, address]);

  const handleVote = async () => {
    if (!isConnected || !address) {
      setError('Por favor, conecte sua carteira primeiro');
      return;
    }

    if (selectedOption === null) {
      setError('Por favor, selecione uma opção');
      return;
    }

    if (!poll || !poll.isOpen) {
      setError('Esta votação está fechada');
      return;
    }

    if (poll.userVote !== null) {
      setError('Você já votou nesta enquete');
      return;
    }

    setIsVoting(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Implementar assinatura via AppKit
      setError('Assinatura de transação via AppKit será implementada. Por enquanto, o envio direto não está ativo.');
      setIsVoting(false);
      return;
    } catch (err: any) {
      setError(err.message || 'Erro ao votar. Tente novamente.');
    } finally {
      setIsVoting(false);
    }
  };

  if (loading && !poll) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando enquete...</div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-center text-gray-500">Enquete não encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{poll.title}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            poll.isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {poll.isOpen ? '🟢 Aberta' : '🔴 Fechada'}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Total de votos: <span className="font-semibold">{poll.totalVotes}</span>
        </p>
      </div>

      <div className="space-y-3 mb-4">
        {poll.options.map((option, index) => (
          <div key={index} className="relative">
            {poll.isOpen && poll.userVote === null && isConnected ? (
              <button
                onClick={() => setSelectedOption(index)}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                  selectedOption === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{option.text}</span>
                  {selectedOption === index && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
              </button>
            ) : (
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{option.text}</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {option.votes} votos ({option.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
                {poll.userVote === index && (
                  <span className="text-xs text-blue-600 mt-1 block">✓ Seu voto</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {poll.isOpen && poll.userVote === null && isConnected && (
        <button
          onClick={handleVote}
          disabled={isVoting || selectedOption === null}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isVoting ? 'Votando...' : `Votar (0.01 STX)`}
        </button>
      )}

      {poll.userVote !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            ✓ Você já votou nesta enquete na opção: <strong>{poll.options[poll.userVote].text}</strong>
          </p>
        </div>
      )}

      {!isConnected && poll.isOpen && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Conecte sua carteira para votar
        </p>
      )}

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2">
          <p className="text-green-800 text-sm">Voto registrado com sucesso! 🎉</p>
        </div>
      )}
    </div>
  );
}

