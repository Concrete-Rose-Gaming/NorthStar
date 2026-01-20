import React, { useState, useEffect } from 'react';
import { LocalCard, CardType } from '../../types/Card';
import { generateCardCode } from '../../utils/cardCode';
import CardPreview from '../CardPreview/CardPreview';
import ImageUpload from '../ImageUpload/ImageUpload';
import './CardEditor.css';

interface CardEditorProps {
  card: LocalCard;
  onSave: (card: LocalCard, syncToSupabase: boolean) => void;
}

function CardEditor({ card, onSave }: CardEditorProps) {
  const [formData, setFormData] = useState<LocalCard>(card);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setFormData(card);
  }, [card]);

  const handleChange = (field: keyof LocalCard, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (field: string, subField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof LocalCard] as any),
        [subField]: value
      }
    }));
  };

  const handleImageUploaded = (url: string | null) => {
    setFormData(prev => ({
      ...prev,
      card_art: url,
      artwork_synced: !!url
    }));
  };

  const getCardCode = () => {
    if (formData.code) return formData.code;
    if (!formData.expansion || !formData.card_type || !formData.card_number) {
      return '';
    }
    return generateCardCode(formData.expansion, formData.card_type, formData.card_number);
  };

  const handleSave = (sync: boolean = false) => {
    // Auto-generate code if empty
    const cardToSave = { ...formData };
    if (!cardToSave.code) {
      cardToSave.code = getCardCode();
    }
    
    // Ensure type-specific data has the code
    if (cardToSave.chef_data) {
      cardToSave.chef_data.code = cardToSave.code;
    }
    if (cardToSave.restaurant_data) {
      cardToSave.restaurant_data.code = cardToSave.code;
    }
    if (cardToSave.meal_data) {
      cardToSave.meal_data.code = cardToSave.code;
    }
    if (cardToSave.staff_data) {
      cardToSave.staff_data.code = cardToSave.code;
    }
    if (cardToSave.event_data) {
      cardToSave.event_data.code = cardToSave.code;
    }
    
    onSave(cardToSave, sync);
  };

  const handleTypeChange = (newType: CardType) => {
    const code = formData.code || getCardCode();
    const newData: any = { ...formData, card_type: newType };
    
    // Initialize type-specific data when type changes
    if (newType === 'CHEF') {
      newData.chef_data = { code, starting_influence: 3, star_bonus_influence: 1 };
      newData.restaurant_data = null;
      newData.meal_data = null;
      newData.staff_data = null;
      newData.event_data = null;
    } else if (newType === 'RESTAURANT') {
      newData.restaurant_data = { code, required_stars: 0 };
      newData.chef_data = null;
      newData.meal_data = null;
      newData.staff_data = null;
      newData.event_data = null;
    } else if (newType === 'MEAL') {
      newData.meal_data = { code, influence_cost: 1 };
      newData.chef_data = null;
      newData.restaurant_data = null;
      newData.staff_data = null;
      newData.event_data = null;
    } else if (newType === 'STAFF') {
      newData.staff_data = { code, influence_cost: 2 };
      newData.chef_data = null;
      newData.restaurant_data = null;
      newData.meal_data = null;
      newData.event_data = null;
    } else if (newType === 'EVENT') {
      newData.event_data = { code, influence_cost: 2 };
      newData.chef_data = null;
      newData.restaurant_data = null;
      newData.meal_data = null;
      newData.staff_data = null;
    } else {
      newData.chef_data = null;
      newData.restaurant_data = null;
      newData.meal_data = null;
      newData.staff_data = null;
      newData.event_data = null;
    }
    
    setFormData(newData);
  };

  const renderTypeSpecificFields = () => {
    switch (formData.card_type) {
      case 'CHEF':
        return (
          <div className="form-section">
            <h3>Chef Data</h3>
            <div className="form-row">
              <label>
                Starting Influence:
                <input
                  type="number"
                  value={formData.chef_data?.starting_influence ?? 3}
                  onChange={(e) => handleNestedChange('chef_data', 'starting_influence', parseInt(e.target.value) || 0)}
                />
              </label>
              <label>
                Star Bonus Influence:
                <input
                  type="number"
                  value={formData.chef_data?.star_bonus_influence ?? 1}
                  onChange={(e) => handleNestedChange('chef_data', 'star_bonus_influence', parseInt(e.target.value) || 0)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Primary Archetype:
                <input
                  type="text"
                  value={formData.chef_data?.Restaurant_Focus_1 || ''}
                  onChange={(e) => handleNestedChange('chef_data', 'Restaurant_Focus_1', e.target.value)}
                  placeholder="e.g., Breakfast, Diner"
                />
              </label>
              <label>
                Secondary Archetype (optional):
                <input
                  type="text"
                  value={formData.chef_data?.Restaurant_Focus_2 || ''}
                  onChange={(e) => handleNestedChange('chef_data', 'Restaurant_Focus_2', e.target.value)}
                />
              </label>
            </div>
          </div>
        );

      case 'RESTAURANT':
        return (
          <div className="form-section">
            <h3>Restaurant Data</h3>
            <div className="form-row">
              <label>
                Primary Archetype:
                <input
                  type="text"
                  value={formData.restaurant_data?.Restaurant_Focus_1 || ''}
                  onChange={(e) => handleNestedChange('restaurant_data', 'Restaurant_Focus_1', e.target.value)}
                />
              </label>
              <label>
                Required Stars:
                <input
                  type="number"
                  value={formData.restaurant_data?.required_stars ?? 0}
                  onChange={(e) => handleNestedChange('restaurant_data', 'required_stars', parseInt(e.target.value) || 0)}
                />
              </label>
            </div>
          </div>
        );

      case 'MEAL':
        return (
          <div className="form-section">
            <h3>Meal Data</h3>
            <div className="form-row">
              <label>
                Influence Cost:
                <input
                  type="number"
                  value={formData.meal_data?.influence_cost ?? 1}
                  onChange={(e) => handleNestedChange('meal_data', 'influence_cost', parseInt(e.target.value) || 0)}
                />
              </label>
              <label>
                Food Type (Archetype):
                <input
                  type="text"
                  value={formData.meal_data?.food_type || ''}
                  onChange={(e) => handleNestedChange('meal_data', 'food_type', e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Restaurant Type 1:
                <input
                  type="text"
                  value={formData.meal_data?.restaurant_type_1 || ''}
                  onChange={(e) => handleNestedChange('meal_data', 'restaurant_type_1', e.target.value)}
                />
              </label>
              <label>
                Restaurant Type 2:
                <input
                  type="text"
                  value={formData.meal_data?.restaurant_type_2 || ''}
                  onChange={(e) => handleNestedChange('meal_data', 'restaurant_type_2', e.target.value)}
                />
              </label>
            </div>
          </div>
        );

      case 'STAFF':
        return (
          <div className="form-section">
            <h3>Staff Data</h3>
            <div className="form-row">
              <label>
                Influence Cost:
                <input
                  type="number"
                  value={formData.staff_data?.influence_cost ?? 2}
                  onChange={(e) => handleNestedChange('staff_data', 'influence_cost', parseInt(e.target.value) || 0)}
                />
              </label>
              <label>
                Employee Type (Archetype):
                <input
                  type="text"
                  value={formData.staff_data?.employee_type || ''}
                  onChange={(e) => handleNestedChange('staff_data', 'employee_type', e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Restaurant Type:
                <input
                  type="text"
                  value={formData.staff_data?.restaurant_type || ''}
                  onChange={(e) => handleNestedChange('staff_data', 'restaurant_type', e.target.value)}
                />
              </label>
            </div>
          </div>
        );

      case 'EVENT':
        return (
          <div className="form-section">
            <h3>Event Data</h3>
            <div className="form-row">
              <label>
                Influence Cost:
                <input
                  type="number"
                  value={formData.event_data?.influence_cost ?? 2}
                  onChange={(e) => handleNestedChange('event_data', 'influence_cost', parseInt(e.target.value) || 0)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                First Enum:
                <input
                  type="text"
                  value={formData.event_data?.first_enum || ''}
                  onChange={(e) => handleNestedChange('event_data', 'first_enum', e.target.value)}
                />
              </label>
              <label>
                Second Enum:
                <input
                  type="text"
                  value={formData.event_data?.second_enum || ''}
                  onChange={(e) => handleNestedChange('event_data', 'second_enum', e.target.value)}
                />
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="card-editor">
      <div className="card-editor-header">
        <h2>{formData.code || 'New Card'}</h2>
        <button
          className="btn btn-secondary"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide' : 'Show'} Preview
        </button>
      </div>

      <div className="card-editor-content">
        <div className="card-editor-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <label>
                Code (auto-generated):
                <input
                  type="text"
                  value={formData.code || getCardCode()}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="Will be auto-generated if empty"
                />
              </label>
              <label>
                Expansion:
                <input
                  type="text"
                  value={formData.expansion}
                  onChange={(e) => handleChange('expansion', e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Card Type:
                <select
                  value={formData.card_type}
                  onChange={(e) => handleTypeChange(e.target.value as CardType)}
                >
                  <option value="CHEF">Chef</option>
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="MEAL">Meal</option>
                  <option value="STAFF">Staff</option>
                  <option value="SUPPORT">Support</option>
                  <option value="EVENT">Event</option>
                </select>
              </label>
              <label>
                Card Number:
                <input
                  type="number"
                  value={formData.card_number}
                  onChange={(e) => handleChange('card_number', parseInt(e.target.value) || 0)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Name:
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Description:
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Effect:
                <textarea
                  value={formData.effect || ''}
                  onChange={(e) => handleChange('effect', e.target.value || null)}
                  rows={2}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Value:
                <input
                  type="number"
                  value={formData.value || ''}
                  onChange={(e) => handleChange('value', e.target.value ? parseInt(e.target.value) : null)}
                />
              </label>
              <label>
                Worth:
                <input
                  type="number"
                  value={formData.worth}
                  onChange={(e) => handleChange('worth', parseInt(e.target.value) || 0)}
                />
              </label>
              <label>
                Rarity:
                <input
                  type="text"
                  value={formData.rarity || ''}
                  onChange={(e) => handleChange('rarity', e.target.value || null)}
                />
              </label>
            </div>
          </div>

          {renderTypeSpecificFields()}

          <div className="form-section">
            <h3>Artwork</h3>
            <ImageUpload
              cardCode={formData.code || getCardCode()}
              currentImageUrl={formData.card_art}
              onImageUploaded={handleImageUploaded}
            />
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={() => handleSave(false)}
            >
              Save Locally
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleSave(true)}
            >
              Save & Sync to Supabase
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="card-editor-preview">
            <CardPreview card={formData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default CardEditor;

