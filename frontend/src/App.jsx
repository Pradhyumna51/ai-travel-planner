import React, { useState, useCallback } from 'react';
import TripPlanningForm from './components/TripForm';
import LoadingSpinner from './components/LoadingSpinner';
import BudgetValidatorModal from './components/BudgetValidator';
import ItineraryResults from './components/ItineraryResults';
import SavedJourneys from './components/SavedJourneys';
import { validateBudget, generateItinerary, getTripDetails } from './services/api';

const TIMEOUT_MS = 60_000;

function getDurationDays(s, e) {
  return Math.ceil((new Date(e) - new Date(s)) / 86_400_000) + 1;
}

function friendlyError(err) {
  if (!err.response) return 'Cannot reach the server. Check your connection.';
  const s = err.response.status;
  const errorData = err.response?.data?.error;
  let m = '';
  if (typeof errorData === 'object' && errorData !== null) {
    m = errorData.message || JSON.stringify(errorData);
  } else {
    m = errorData || '';
  }
  if (s === 400) return m || 'Some details look off. Review the form.';
  if (s === 429) return 'API rate limited. Try again in a moment.';
  if (s === 500) return 'Something broke on our end. Please retry.';
  return m || 'Something went wrong. Please retry.';
}

export default function App() {
  const [step, setStep] = useState('form');
  const [apiError, setApiError] = useState('');
  const [results, setResults] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [validation, setValidation] = useState(null);
  const [pendingTrip, setPendingTrip] = useState(null);
  const [timeoutMsg, setTimeoutMsg] = useState('');

  const generateWithTimeout = useCallback(async (tripData) => {
    setStep('loading');
    setApiError('');
    setTimeoutMsg('');
    const t30 = setTimeout(() => setTimeoutMsg('Taking longer than expected. Still working…'), 30_000);
    try {
      const controller = new AbortController();
      const kill = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const data = await generateItinerary(tripData);
      clearTimeout(kill);
      clearTimeout(t30);
      setResults(data);
      setStep('results');
    } catch (err) {
      clearTimeout(t30);
      setStep('form');
      setApiError(friendlyError(err));
    }
  }, []);

  const handleFormSubmit = useCallback(async (formData) => {
    setApiError('');
    setPendingTrip(formData);
    const dur = getDurationDays(formData.start_date, formData.end_date);
    setStep('loading');
    try {
      const check = await validateBudget(formData.destination, dur, formData.travelers, formData.budget, formData.start_date, formData.end_date, formData.travel_style);
      setValidation(check);
      if (check.isValid) {
        await generateWithTimeout(formData);
      } else {
        setStep('form');
        setModalOpen(true);
      }
    } catch (err) {
      setStep('form');
      setApiError(friendlyError(err));
    }
  }, [generateWithTimeout]);

  const handleContinue = useCallback(async () => {
    setModalOpen(false);
    if (pendingTrip) await generateWithTimeout(pendingTrip);
  }, [pendingTrip, generateWithTimeout]);

  const handleAdjust = useCallback(() => setModalOpen(false), []);

  const handleReset = useCallback(() => {
    setStep('form');
    setResults(null);
    setPendingTrip(null);
    setValidation(null);
    setApiError('');
  }, []);

  const handleRetry = useCallback(() => {
    if (pendingTrip) handleFormSubmit(pendingTrip);
  }, [pendingTrip, handleFormSubmit]);

  const handleSelectSavedTrip = useCallback(async (id) => {
    setStep('loading');
    setApiError('');
    try {
      const data = await getTripDetails(id);
      setResults(data);
      setStep('results');
    } catch (err) {
      setStep('saved-list');
      setApiError(friendlyError(err));
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ── Nav ── */}
      <header className="no-print" style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
              color: 'var(--color-text)', letterSpacing: '2px',
            }}>
              ROAM
            </span>
            <span style={{
              display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
              background: 'var(--color-teal)', marginLeft: 2, marginBottom: 1,
            }} />
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <button onClick={handleReset} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: (step === 'form' || step === 'loading' || (step === 'results' && (!results || !results.trip || !results.trip.id))) ? 600 : 400,
              color: (step === 'form' || step === 'loading' || (step === 'results' && (!results || !results.trip || !results.trip.id))) ? 'var(--color-teal)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}>
              Plan Journey
            </button>
            <button onClick={() => { setStep('saved-list'); setResults(null); }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: (step === 'saved-list' || (step === 'results' && results && results.trip && results.trip.id)) ? 600 : 400,
              color: (step === 'saved-list' || (step === 'results' && results && results.trip && results.trip.id)) ? 'var(--color-teal)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}>
              Saved Journeys
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' }}>
        {step === 'form' && (
          <TripPlanningForm
            onSubmit={handleFormSubmit}
            isLoading={false}
            apiError={apiError}
            onRetry={apiError ? handleRetry : null}
          />
        )}

        {step === 'loading' && (
          <div>
            <LoadingSpinner destination={pendingTrip?.destination} />
            {timeoutMsg && (
              <p style={{
                textAlign: 'center', fontSize: 12,
                color: 'var(--color-amber)', marginTop: 8,
                fontFamily: 'var(--font-mono)',
              }}>
                {timeoutMsg}
              </p>
            )}
          </div>
        )}

        {step === 'results' && results && (
          <ItineraryResults results={results} onReset={handleReset} />
        )}

        {step === 'saved-list' && (
          <SavedJourneys onSelect={handleSelectSavedTrip} />
        )}
      </main>

      {/* ── Budget modal ── */}
      {validation && (
        <BudgetValidatorModal
          isOpen={modalOpen}
          userBudget={pendingTrip?.budget}
          estimatedBudget={validation.estimatedBudget}
          message={validation.message}
          recommendation={validation.recommendation}
          onContinue={handleContinue}
          onAdjust={handleAdjust}
        />
      )}
    </div>
  );
}
