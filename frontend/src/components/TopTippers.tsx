import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, contractName } from '../utils/contract';

// API do Hiro para buscar transações (tem CORS habilitado)
const STACKS_API_URL = 'https://api.hiro.so';

interface TipperStats {
  address: string;
  totalSent: number;
  count: number;
}

export function TopTippers() {
  const [tippers, setTippers] = useState<TipperStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopTippers = async () => {
      setLoading(true);
      setError(null);

      try {
        const network = createNetwork('mainnet');
        
        // Primeiro, buscar transações do contrato para descobrir quais endereços enviaram tips
        const contractId = `${contractAddress}.${contractName}`;
        // Buscar transações usando endpoint de contrato (não de endereço)
        // Tentar endpoint de eventos/transações do contrato
        const transactionsUrl = `${STACKS_API_URL}/extended/v1/tx/contract_call?contract_id=${contractId}&function_name=tip&limit=100`;
        
        console.log('Buscando transações do contrato...', transactionsUrl);
        
        let uniqueSenders = new Set<string>();
        
        try {
          const transactionsResponse = await fetch(transactionsUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (!transactionsResponse.ok) {
            throw new Error(`HTTP error! status: ${transactionsResponse.status}`);
          }
          
          const transactionsData = await transactionsResponse.json();
          console.log('Dados de transações recebidos:', transactionsData);
          
          // Extrair endereços únicos que chamaram a função 'tip'
          // O formato pode variar dependendo do endpoint usado
          const transactions = transactionsData.results || transactionsData || [];
          
          for (const tx of transactions) {
            // Verificar se é uma chamada de contrato para a função 'tip'
            const isTipCall = 
              tx.tx_type === 'contract_call' &&
              tx.contract_call &&
              (tx.contract_call.contract_id === contractId || 
               (tx.contract_call.contract_address === contractAddress && 
                tx.contract_call.contract_name === contractName)) &&
              tx.contract_call.function_name === 'tip';
            
            if (isTipCall && tx.sender_address) {
              uniqueSenders.add(tx.sender_address);
              console.log('Encontrado tipper:', tx.sender_address);
            }
          }
        } catch (apiError: any) {
          console.warn('Erro ao buscar transações via API, usando fallback do contrato:', apiError.message);
          // Fallback: descobrir endereços usando o contrato diretamente
          // Como não podemos iterar sobre todos os endereços, vamos usar uma abordagem diferente:
          // Tentar descobrir endereços através de uma lista conhecida ou através de uma busca inteligente
          try {
            const counterResult = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: 'get-tip-counter',
              functionArgs: [],
              network,
              senderAddress: contractAddress,
            });
            
            const counter = cvToJSON(counterResult);
            const totalTips = parseInt(counter.value || '0');
            console.log('Total de tips encontrados:', totalTips);
            
            if (totalTips > 0) {
              console.log('Tentando descobrir endereços através do contrato...');
              
              // Lista de endereços conhecidos para testar
              // Em produção, você manteria uma lista atualizada ou usaria eventos
              // Por enquanto, vamos tentar descobrir através de uma busca mais ampla
              // testando endereços que podem ter interagido com o contrato
              
              // Abordagem: Como sabemos que há tips, vamos tentar descobrir os endereços
              // testando uma lista de endereços conhecidos ou usando uma heurística
              
              // Nota: Esta é uma limitação do design atual do contrato
              // Idealmente, o contrato teria uma função que lista todos os tippers
              // ou usaríamos eventos do blockchain para rastrear
              
              console.log('Não foi possível descobrir endereços automaticamente via API.');
              console.log('Sugestão: Adicione endereços conhecidos manualmente ou use eventos do blockchain.');
            }
          } catch (fallbackError: any) {
            console.error('Erro no fallback também:', fallbackError);
          }
        }

        console.log('Endereços únicos encontrados:', Array.from(uniqueSenders));
        
        // Se não encontrou nenhum endereço via API, tentar descobrir através do contrato
        // usando uma lista de endereços conhecidos ou uma busca mais inteligente
        if (uniqueSenders.size === 0) {
          console.log('Nenhum endereço encontrado via API. Tentando descobrir através do contrato...');
          
          // Lista de endereços conhecidos para testar
          // Em produção, você manteria esta lista atualizada ou usaria eventos
          const knownAddressesToTest: string[] = [
            // Adicione endereços conhecidos aqui
            // Por exemplo, endereços que você sabe que enviaram tips
          ];
          
          // Se não há endereços conhecidos, vamos mostrar uma mensagem informativa
          // mas ainda assim tentar buscar stats para endereços que possam ter interagido
          if (knownAddressesToTest.length === 0) {
            // Tentar descobrir através de uma busca mais ampla seria muito ineficiente
            // Por enquanto, vamos mostrar uma mensagem informativa
            setError('Não foi possível descobrir endereços automaticamente. As APIs externas estão indisponíveis. Para usar esta funcionalidade, adicione endereços conhecidos na lista "knownAddressesToTest" no código ou use eventos do blockchain.');
            setLoading(false);
            return;
          }
          
          // Testar cada endereço conhecido
          for (const address of knownAddressesToTest) {
            try {
              const statsResult = await fetchCallReadOnlyFunction({
                contractAddress,
                contractName,
                functionName: 'get-tipper-stats',
                functionArgs: [standardPrincipalCV(address)],
                network,
                senderAddress: contractAddress,
              });
              
              const stats = cvToJSON(statsResult);
              if (stats.type !== 'none' && stats.value) {
                uniqueSenders.add(address);
                console.log('Encontrado tipper conhecido:', address);
              }
            } catch (err: any) {
              // Continue para o próximo endereço
              continue;
            }
          }
          
          if (uniqueSenders.size === 0) {
            setError('Não foi possível encontrar endereços que enviaram tips. As APIs estão indisponíveis e não há endereços conhecidos configurados.');
            return;
          }
        }

        const tipperStats: TipperStats[] = [];

        // Buscar stats para cada endereço que enviou tips
        for (const address of Array.from(uniqueSenders)) {
          try {
            const statsResult = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName,
              functionName: 'get-tipper-stats',
              functionArgs: [standardPrincipalCV(address)],
              network,
              senderAddress: contractAddress,
            });

            const stats = cvToJSON(statsResult);
            console.log(`Stats para ${address}:`, JSON.stringify(stats, null, 2));
            
            // Se o endereço tem stats (não é none)
            if (stats.type !== 'none' && stats.value) {
              // O formato pode ser diferente, tentar várias possibilidades
              let totalSentValue = '0';
              let countValue = '0';
              
              // Tentar diferentes formatos de acesso aos dados
              if (stats.value['total-sent']) {
                totalSentValue = stats.value['total-sent'].value || stats.value['total-sent'] || '0';
              } else if (stats.value.totalSent) {
                totalSentValue = stats.value.totalSent.value || stats.value.totalSent || '0';
              } else if (typeof stats.value === 'object') {
                // Tentar acessar diretamente
                const keys = Object.keys(stats.value);
                console.log('Chaves disponíveis:', keys);
                for (const key of keys) {
                  if (key.includes('total') || key.includes('sent')) {
                    const val = stats.value[key];
                    totalSentValue = val?.value || val || '0';
                  }
                  if (key === 'count') {
                    const val = stats.value[key];
                    countValue = val?.value || val || '0';
                  }
                }
              }
              
              if (stats.value.count) {
                countValue = stats.value.count.value || stats.value.count || '0';
              }
              
              const totalSent = parseInt(String(totalSentValue)) / 1000000;
              const count = parseInt(String(countValue));
              
              console.log(`Tipper ${address}: ${totalSent} STX (${totalSentValue} micro-STX), ${count} tips`);
              
              if (totalSent > 0 || count > 0) {
                tipperStats.push({
                  address,
                  totalSent,
                  count,
                });
              }
            }
          } catch (err: any) {
            console.log(`Erro ao buscar stats para ${address}:`, err.message);
            // Continue para o próximo endereço
            continue;
          }
        }

        // Ordenar por total enviado (maior primeiro)
        tipperStats.sort((a, b) => b.totalSent - a.totalSent);

        // Limitar aos top 10
        setTippers(tipperStats.slice(0, 10));
        
        console.log('Top tippers encontrados:', tipperStats.length, tipperStats);
      } catch (err: any) {
        console.error('Erro ao buscar top tippers:', err);
        setError(err.message || 'Erro ao carregar ranking');
      } finally {
        setLoading(false);
      }
    };

    fetchTopTippers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center text-gray-500">Carregando ranking...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {tippers.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p className="mb-2">Nenhum tipper ainda</p>
          <p className="text-sm">O ranking aparecerá aqui quando houver tips enviados</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {tippers.map((tipper, index) => (
            <div key={tipper.address} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tipper.address.slice(0, 8)}...{tipper.address.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tipper.count} {tipper.count === 1 ? 'tip' : 'tips'}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-blue-600">
                  {tipper.totalSent.toFixed(6)} STX
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

