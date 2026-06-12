import { useState } from "react";
import { Plus, X } from "lucide-react";

interface StepsInputProps {
  steps: string[];
  onStepsChange: (steps: string[]) => void;
}

export const StepsInput = ({ steps, onStepsChange }: StepsInputProps) => {
  const [newStep, setNewStep] = useState("");

  const addStep = () => {
    if (newStep.trim()) {
      onStepsChange([...steps, newStep.trim()]);
      setNewStep("");
    }
  };

  const updateStep = (index: number, value: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = value;
    onStepsChange(updatedSteps);
  };

  const removeStep = (index: number) => {
    onStepsChange(steps.filter((_, i) => i !== index));
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    const updatedSteps = [...steps];
    const [movedStep] = updatedSteps.splice(fromIndex, 1);
    updatedSteps.splice(toIndex, 0, movedStep);
    onStepsChange(updatedSteps);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addStep();
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Steps 
      </label>

      {/* Add new step */}
      <div className="flex space-x-2">
        <textarea
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter a cooking step..."
          rows={2}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
        />
        <button
          type="button"
          onClick={addStep}
          disabled={!newStep.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Existing steps */}
      {steps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Steps ({steps.length}):
          </h4>
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md group"
            >
              {/* Step number and drag handle */}
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-600 bg-white rounded-full w-6 h-6 flex items-center justify-center border">
                  {index + 1}
                </span>
              </div>

              {/* Step content */}
              <textarea
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                rows={4}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter step instructions..."
              />

              {/* Move buttons and delete */}
              <div className="flex flex-col space-y-1 flex-shrink-0">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveStep(index, index - 1)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Move up"
                  >
                    ↑
                  </button>
                )}
                {index < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveStep(index, index + 1)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Move down"
                  >
                    ↓
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete step"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {steps.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No steps added yet. Add your first cooking step above.
        </p>
      )}
    </div>
  );
};
