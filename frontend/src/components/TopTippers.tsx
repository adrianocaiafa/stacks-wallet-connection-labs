import { useState, useEffect } from 'react';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
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
        
        console.log('Buscando tippers diretamente do contrato v2...');
        
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
        
        const tipperStats: TipperStats[] = [];
        
        // Iterar sobre todos os índices de tippers e buscar suas stats
        // A função get-tipper-at-index-with-stats já retorna address, total-sent e count
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
            console.log(`Tipper ${i} dados:`, JSON.stringify(tipperData, null, 2));
            
            // Verificar se retornou dados (não é none)
            // O formato é: {type: "optional", value: {type: "tuple", value: {...}}}
            if (tipperData.type !== 'none' && tipperData.value) {
              // O tuple está dentro de tipperData.value.value
              // Primeiro tenta value.value (quando há optional wrapper), depois value direto
              let tupleValue = tipperData.value.value;
              
              // Se não tem value.value, tenta value direto
              if (!tupleValue) {
                tupleValue = tipperData.value;
              }
              
              console.log(`Tuple value extraído:`, JSON.stringify(tupleValue, null, 2));
              
              // O contrato retorna: {address: principal, total-sent: uint, count: uint}
              const address = tupleValue?.address?.value || tupleValue?.address;
              const totalSentValue = tupleValue?.['total-sent']?.value || tupleValue?.['total-sent'] || '0';
              const countValue = tupleValue?.count?.value || tupleValue?.count || '0';
              
              console.log(`Extraído - address: ${address}, total-sent: ${totalSentValue}, count: ${countValue}`);
              
              if (address) {
                const totalSent = parseInt(String(totalSentValue)) / 1000000; // Converter de micro-STX para STX
                const count = parseInt(String(countValue));
                
                console.log(`Tipper ${i}: ${address} - ${totalSent} STX (${totalSentValue} micro-STX), ${count} tips`);
                
                tipperStats.push({
                  address: String(address),
                  totalSent,
                  count,
                });
              } else {
                console.log(`Tipper ${i}: endereço não encontrado nos dados. TupleValue:`, tupleValue);
              }
            } else {
              console.log(`Tipper ${i}: retornou none ou sem dados. Type: ${tipperData.type}, hasValue: ${!!tipperData.value}`);
            }
          } catch (err: any) {
            console.log(`Erro ao buscar tipper no índice ${i}:`, err.message);
            continue;
          }
        }
        
        console.log('Total de tippers processados:', tipperStats.length);

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

