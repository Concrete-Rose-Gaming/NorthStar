import React from 'react';
import './Tutorial.css';

interface TutorialProps {
  onClose: () => void;
}

export function Tutorial({ onClose }: TutorialProps) {
  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-header">
          <h2>How to Play</h2>
          <button className="tutorial-close" onClick={onClose}>×</button>
        </div>
        <div className="tutorial-content">
          <section>
            <h3>Objective</h3>
            <p>Be the first player to collect 5 stars by winning rounds!</p>
          </section>

          <section>
            <h3>Game Setup</h3>
            <ul>
              <li>Build a deck with 30 cards (Meals, Staff, Support, and Events)</li>
              <li>Choose 1 Chef card and 3 Restaurant cards</li>
              <li>Draw 5 cards for your starting hand</li>
              <li>Mulligan cards you don't want</li>
            </ul>
          </section>

          <section>
            <h3>Card Types</h3>
            <ul>
              <li><strong>Chef:</strong> Your main character with special abilities</li>
              <li><strong>Restaurant:</strong> Your base with scoring bonuses</li>
              <li><strong>Meal:</strong> Contributes points to your score</li>
              <li><strong>Staff:</strong> Provides bonuses and modifiers</li>
              <li><strong>Support:</strong> Temporary or permanent enhancements</li>
              <li><strong>Event:</strong> One-time effects that can help or hinder (limited to one per round)</li>
            </ul>
          </section>

          <section>
            <h3>Gameplay</h3>
            <ul>
              <li>At the start of each round, draw cards until you have 5 in hand (or until your deck is empty)</li>
              <li>Each round, both players take turns playing cards</li>
              <li>Play cards from your hand to build your restaurant</li>
              <li>You can only play <strong>one event card per round</strong></li>
              <li>End your turn when you're done playing cards</li>
              <li>After both players end their turns, scores are compared</li>
              <li>The player with the higher score wins the round and gains 1 star</li>
              <li>First to 5 stars wins the game!</li>
            </ul>
          </section>

          <section>
            <h3>Strategy Tips</h3>
            <ul>
              <li>Balance your deck with different card types</li>
              <li>Use Staff and Support cards to boost your Meals</li>
              <li>Save Event cards for critical moments - remember you can only play one per round!</li>
              <li>Pay attention to your Restaurant's special ability</li>
              <li>Manage your hand size and deck resources</li>
            </ul>
          </section>
        </div>
        <div className="tutorial-footer">
          <button className="tutorial-button" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>
  );
}

