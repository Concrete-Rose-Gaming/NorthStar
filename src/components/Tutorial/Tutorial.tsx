import React, { useState } from 'react';
import { Card } from '../Card/Card';
import { CARD_DEFINITIONS, CardType } from '../../game/CardTypes';
import './Tutorial.css';

interface TutorialProps {
  onClose: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'Welcome to Chef Card Game!',
      content: (
        <div className="tutorial-content">
          <p>In this strategic card game, you play as a chef competing to earn stars by running the best restaurant.</p>
          <p><strong>Goal:</strong> Be the first player to earn 5 stars!</p>
        </div>
      )
    },
    {
      title: 'Your Deck',
      content: (
        <div className="tutorial-content">
          <p>Each player builds a deck with:</p>
          <ul>
            <li><strong>1 Chef Card</strong> - Your character with a special ability (cannot be removed)</li>
            <li><strong>3 Restaurant Cards</strong> - One will be randomly selected for the game (cannot be removed)</li>
            <li><strong>30 Main Deck Cards</strong> - Mix of Meals, Staff, Support, and Event cards</li>
          </ul>
          <p><strong>Rule:</strong> Maximum 3 copies of any card in your main deck.</p>
        </div>
      )
    },
    {
      title: 'Card Types',
      content: (
        <div className="tutorial-content">
          <div className="card-types-grid">
            <div className="card-type-example">
              <Card card={CARD_DEFINITIONS['chef_001']} size="small" />
              <p><strong>Chef Cards</strong> - Your character with base value and special ability</p>
            </div>
            <div className="card-type-example">
              <Card card={CARD_DEFINITIONS['restaurant_001']} size="small" />
              <p><strong>Restaurant Cards</strong> - Base score and conditional abilities</p>
            </div>
            <div className="card-type-example">
              <Card card={CARD_DEFINITIONS['meal_001']} size="small" />
              <p><strong>Meal Cards</strong> - Add points to your restaurant score</p>
            </div>
            <div className="card-type-example">
              <Card card={CARD_DEFINITIONS['staff_001']} size="small" />
              <p><strong>Staff Cards</strong> - Provide bonuses and modifiers</p>
            </div>
            <div className="card-type-example">
              <Card card={CARD_DEFINITIONS['support_001']} size="small" />
              <p><strong>Support Cards</strong> - Utility and enhancement effects</p>
            </div>
            <div className="card-type-example">
              <Card card={CARD_DEFINITIONS['event_001']} size="small" />
              <p><strong>Event Cards</strong> - One-time effects and disruptions</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Game Setup',
      content: (
        <div className="tutorial-content">
          <ol>
            <li><strong>Build Your Deck</strong> - Select 1 Chef, 3 Restaurants, and 30 main deck cards</li>
            <li><strong>Initial Draw</strong> - Both players draw 5 cards</li>
            <li><strong>Mulligan</strong> - Optionally redraw unwanted cards</li>
            <li><strong>Coin Flip</strong> - Determines who goes first</li>
            <li><strong>Random Restaurant</strong> - One of your 3 restaurants is randomly selected</li>
          </ol>
        </div>
      )
    },
    {
      title: 'Gameplay - Rounds',
      content: (
        <div className="tutorial-content">
          <p>Each round follows these steps:</p>
          <ol>
            <li><strong>Draw Phase</strong> - Both players draw 1 card</li>
            <li><strong>Turn Phase</strong> - Players take turns simultaneously:
              <ul>
                <li>Play cards from your hand</li>
                <li>Meal cards go to your restaurant</li>
                <li>Staff, Support, and Event cards activate their effects</li>
                <li>Click "End Turn" when done</li>
              </ul>
            </li>
            <li><strong>Face-Off</strong> - When both players end their turn:
              <ul>
                <li>Scores are calculated</li>
                <li>Restaurant with higher score gets 1 star</li>
                <li>First to 5 stars wins!</li>
              </ul>
            </li>
          </ol>
        </div>
      )
    },
    {
      title: 'Scoring',
      content: (
        <div className="tutorial-content">
          <p>Your restaurant's score is calculated from:</p>
          <ul>
            <li><strong>Restaurant Base Score</strong> - From your selected restaurant card</li>
            <li><strong>Chef Base Value</strong> - From your chef card</li>
            <li><strong>Meal Points</strong> - Sum of all meal cards played</li>
            <li><strong>Staff Modifiers</strong> - Bonuses from staff cards</li>
            <li><strong>Support Effects</strong> - Temporary or permanent bonuses</li>
            <li><strong>Restaurant Ability</strong> - Bonus if condition is met</li>
            <li><strong>Chef Ability</strong> - Special bonuses from your chef</li>
          </ul>
          <p className="tutorial-tip">💡 Tip: Read your restaurant's ability condition carefully - it can give you a big bonus!</p>
        </div>
      )
    },
    {
      title: 'Strategy Tips',
      content: (
        <div className="tutorial-content">
          <ul>
            <li>Balance your deck - include high-value meals, useful staff, and strategic events</li>
            <li>Pay attention to your restaurant's ability condition</li>
            <li>Use event cards strategically to disrupt your opponent</li>
            <li>Staff cards can multiply your meal values</li>
            <li>Save powerful cards for crucial rounds</li>
            <li>Watch your opponent's played cards to predict their score</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Ready to Play!',
      content: (
        <div className="tutorial-content">
          <p>You're all set! Remember:</p>
          <ul>
            <li>Build a balanced 30-card deck</li>
            <li>Choose your Chef and Restaurants wisely</li>
            <li>Play strategically to maximize your score</li>
            <li>First to 5 stars wins!</li>
          </ul>
          <p className="tutorial-tip">💡 You can view this tutorial anytime by clicking the "How to Play" button.</p>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-header">
          <h2>{tutorialSteps[currentStep].title}</h2>
          <button className="tutorial-close" onClick={onClose}>×</button>
        </div>
        
        <div className="tutorial-body">
          {tutorialSteps[currentStep].content}
        </div>

        <div className="tutorial-footer">
          <div className="tutorial-progress">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>
          <div className="tutorial-nav">
            <button
              className="tutorial-button"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </button>
            <button
              className="tutorial-button primary"
              onClick={nextStep}
            >
              {currentStep === tutorialSteps.length - 1 ? 'Start Playing' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


