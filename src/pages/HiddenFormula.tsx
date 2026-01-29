import { HiddenFormulaStats } from '../components/HiddenFormulaStats';
import { UserHiddenFormulaStats } from '../components/UserHiddenFormulaStats';
import { HiddenFormulaStartGame } from '../components/HiddenFormulaStartGame';
import { HiddenFormulaTestInput } from '../components/HiddenFormulaTestInput';
import { HiddenFormulaSubmitFormula } from '../components/HiddenFormulaSubmitFormula';
import { HiddenFormulaGiveUp } from '../components/HiddenFormulaGiveUp';
import { HiddenFormulaTestHistory } from '../components/HiddenFormulaTestHistory';

export function HiddenFormula() {
  const refresh = () => {
    window.dispatchEvent(new CustomEvent('hidden-formula-refresh'));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🧪 Hidden Formula</h1>
          <p className="text-gray-600 mb-2">
            Descubra a fórmula secreta f(x) = ax² + bx + c testando entradas e deduzindo os coeficientes.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>a: 0–3, b: 0–5, c: 0–10</span>
            <span>12 tentativas de teste</span>
            <span>Sem taxas, apenas gas</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HiddenFormulaStats />
          <UserHiddenFormulaStats />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HiddenFormulaStartGame onStartSuccess={refresh} />
          <HiddenFormulaTestInput onTestSuccess={refresh} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <HiddenFormulaSubmitFormula onSubmitSuccess={refresh} />
          <HiddenFormulaGiveUp onGiveUpSuccess={refresh} />
        </div>
        <div className="mt-6">
          <HiddenFormulaTestHistory />
        </div>
      </div>
    </div>
  );
}
