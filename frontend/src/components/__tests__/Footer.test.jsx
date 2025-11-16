import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders the footer content', () => {
    render(<Footer />);

    expect(screen.getByText('Campus Cart')).toBeInTheDocument();
    expect(screen.getByText('Trade smarter on campus. Buy, sell, and exchange items with fellow students.')).toBeInTheDocument();
    expect(screen.getByText('campus.cart7@gmail.com')).toBeInTheDocument();
  });

  it('displays the current year in copyright', () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);

    expect(screen.getByText(`© ${currentYear} Campus Cart. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders quick links', () => {
    render(<Footer />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});