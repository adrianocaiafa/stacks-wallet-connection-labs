import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV } from '@stacks/transactions';
import { createNetwork } from '@stacks/network';
import { contractAddress, contractName } from '../utils/contract';

// Using v2 contract (now the default)
const contractNameToUse = contractName; // contractName is already 'tip-jar-v2'

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
        
        let uniqueSenders = new Set<string>();
        
        // Usar v2 - buscar endereços diretamente do contrato
        // O contrato v2 mantém uma lista de todos os tippers
        {
          console.log('Usando contrato v2 - buscando tippers diretamente do contrato...');
          
          // Primeiro, obter o número total de tippers
          const tipperCountResult = await fetchCallReadOnlyFunction({
            contractAddress,
            contractName: contractNameToUse,
            functionName: 'get-tipper-count',
            functionArgs: [],
            network,
            senderAddress: contractAddress,
          });
          
          const tipperCount = cvToJSON(tipperCountResult);
          const totalTippers = parseInt(tipperCount.value || '0');
          console.log('Total de tippers encontrados:', totalTippers);
          
          if (totalTippers === 0) {
            setError('Nenhum tipper encontrado ainda.');
            setLoading(false);
            return;
          }
          
          // Iterar sobre todos os índices de tippers e buscar suas stats
          for (let i = 0; i < totalTippers; i++) {
            try {
              const tipperWithStatsResult = await fetchCallReadOnlyFunction({
                contractAddress,
                contractName: contractNameToUse,
                functionName: 'get-tipper-at-index-with-stats',
                functionArgs: [uintCV(i)],
                network,
                senderAddress: contractAddress,
              });
              
              const tipperData = cvToJSON(tipperWithStatsResult);
              
              if (tipperData.type !== 'none' && tipperData.value) {
                const address = tipperData.value.address?.value || tipperData.value.address;
                if (address) {
                  uniqueSenders.add(address);
                  console.log(`Tipper ${i}: ${address}`);
                }
              }
            } catch (err: any) {
              console.log(`Erro ao buscar tipper no índice ${i}:`, err.message);
              continue;
            }
          }
        }

        console.log('Endereços únicos encontrados:', Array.from(uniqueSenders));
        
        if (uniqueSenders.size === 0) {
          setError('Nenhum tipper encontrado.');
          setLoading(false);
          return;
        }

        const tipperStats: TipperStats[] = [];

        // Buscar stats para cada endereço que enviou tips
        for (const address of Array.from(uniqueSenders)) {
          try {
            const statsResult = await fetchCallReadOnlyFunction({
              contractAddress,
              contractName: contractNameToUse,
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

