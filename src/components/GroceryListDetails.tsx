import { useState } from "react";
import { Edit3, Check, X, ArrowLeft, Trash2 } from "lucide-react";
import {
  useGroceryList,
  useUpdateGroceryList,
  useDeleteGroceryList,
} from "../hooks/useGroceryList";
import { GroceryListRecipes } from "./GroceryListRecipes";
import { GroceryListItems } from "./GroceryListItems";
import { Link, useNavigate } from "react-router";

interface GroceryListDetailsProps {
  listId: string;
}

const BackButton = () => {
  return (
    <Link
      to={"/grocery-lists"}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors cursor-pointer w-fit"
    >
      <ArrowLeft className="h-4 w-4" /> Back to Grocery Lists
    </Link>
  );
};

export const GroceryListDetails = ({ listId }: GroceryListDetailsProps) => {
  const navigate = useNavigate();
  const { data: groceryList, isLoading } = useGroceryList(listId);
  const updateMutation = useUpdateGroceryList();
  const deleteMutation = useDeleteGroceryList();

  // State for editing name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // State for editing description
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Name editing handlers
  const handleStartEditName = () => {
    setEditedName(groceryList?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (editedName.trim() && groceryList) {
      try {
        await updateMutation.mutateAsync({
          listId: groceryList.id,
          updates: { name: editedName.trim() },
        });
        setIsEditingName(false);
      } catch (error) {
        console.error("Failed to update name:", error);
      }
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      handleCancelEditName();
    }
  };

  // Description editing handlers
  const handleStartEditDescription = () => {
    setEditedDescription(groceryList?.description || "");
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (groceryList) {
      try {
        await updateMutation.mutateAsync({
          listId: groceryList.id,
          updates: { description: editedDescription.trim() || undefined },
        });
        setIsEditingDescription(false);
      } catch (error) {
        console.error("Failed to update description:", error);
      }
    }
  };

  const handleCancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const handleDescriptionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      // Ctrl+Enter to save (since Enter creates new lines in textarea)
      handleSaveDescription();
    } else if (e.key === "Escape") {
      handleCancelEditDescription();
    }
  };

  // Delete handlers
  const handleDeleteList = async () => {
    if (groceryList) {
      try {
        await deleteMutation.mutateAsync(groceryList.id);
        navigate("/grocery-lists");
      } catch (error) {
        console.error("Failed to delete grocery list:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <BackButton />
        <div className="text-gray-500">Loading grocery list...</div>
      </div>
    );
  }

  if (!groceryList) {
    return (
      <div className="flex justify-center items-center py-12">
        <BackButton />
        <div className="text-gray-500">Grocery list not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <BackButton />
      {/* Header */}
      <div className="mb-8">
        {/* Name and Delete Button Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            {/* Editable Name */}
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleNameKeyPress}
                  className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none flex-1"
                  autoFocus
                  maxLength={100}
                  placeholder="Enter list name..."
                />
                <button
                  onClick={handleSaveName}
                  disabled={!editedName.trim() || updateMutation.isPending}
                  className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save (Enter)"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCancelEditName}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Cancel (Escape)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold text-gray-900">
                  {groceryList.name}
                </h1>
                <button
                  onClick={handleStartEditName}
                  className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-all"
                  title="Edit name"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Delete Button */}
          {!isEditingName && (
            <div className="ml-4">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Delete this list?
                  </span>
                  <button
                    onClick={handleDeleteList}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Yes"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-white bg-red-500 hover:bg-red-600 rounded transition-colors shadow-md"
                  title="Delete grocery list"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Editable Description */}
        <div className="mb-2">
          {isEditingDescription ? (
            <div className="flex gap-2">
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyPress}
                className="flex-1 text-gray-600 bg-transparent border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                autoFocus
                rows={2}
                maxLength={500}
                placeholder="Enter description... (optional)"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleSaveDescription}
                  disabled={updateMutation.isPending}
                  className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save (Ctrl+Enter)"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEditDescription}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Cancel (Escape)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="group">
              {groceryList.description ? (
                <div className="flex items-start gap-2">
                  <p className="text-gray-600 flex-1">
                    {groceryList.description}
                  </p>
                  <button
                    onClick={handleStartEditDescription}
                    className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-all"
                    title="Edit description"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartEditDescription}
                  className="text-gray-400 hover:text-gray-600 text-sm italic transition-colors"
                >
                  + Add description
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-500">
          {groceryList.recipes.length} recipes • {groceryList.items.length}{" "}
          items
        </div>
      </div>

      {/* Recipes Section */}
      <GroceryListRecipes groceryList={groceryList} />

      {/* Items Section */}
      <GroceryListItems groceryList={groceryList} />
    </div>
  );
};
