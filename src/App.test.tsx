import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the UML diagram editor', () => {
  render(<App />);
  expect(screen.getByText(/UML → Java/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /export diagram/i })).toBeInTheDocument();
});

test('opens class editing from the right-click menu', () => {
  render(<App />);

  fireEvent.contextMenu(screen.getByText('Car'));
  fireEvent.click(screen.getByRole('button', { name: 'Edit class' }));

  expect(screen.getByText('CLASS EDITOR')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Car')).toBeInTheDocument();
});

test('offers multiple source languages', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /generate java code/i }));

  const languageSelect = screen.getByRole('combobox', { name: /programming language/i });
  expect(languageSelect).toHaveValue('java');
  expect(screen.getByRole('option', { name: 'Python' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'TypeScript' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'C#' })).toBeInTheDocument();
});
