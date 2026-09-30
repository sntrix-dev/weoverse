import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DsGalleryPage } from '@/features/dev/pages/DsGalleryPage';
import { Button, Chip, isrStage, oPowerStage, Tabs, Toggle, WeOCard } from '..';

describe('design system', () => {
  it('renders every ported component without React warnings', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<DsGalleryPage />);
    expect(screen.getByRole('heading', { name: 'Design system' })).toBeInTheDocument();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('Button fills with its tone on hover and turns bold', () => {
    render(<Button tone="violet">Collect</Button>);
    const b = screen.getByRole('button', { name: 'Collect' });
    expect(b.style.fontWeight).toBe('450');
    fireEvent.mouseEnter(b);
    expect(b.style.fontWeight).toBe('700');
    expect(b.style.color).toBe('rgb(255, 255, 255)');
  });

  it('Toggle reports the next value', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} aria-label="Mya" />);
    await userEvent.click(screen.getByRole('switch', { name: 'Mya' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('Tabs selects by value and accepts plain strings', async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={['All', 'Closing']} value="All" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Closing' }));
    expect(onChange).toHaveBeenCalledWith('Closing');
  });

  it('Chip remove does not bubble to the chip', async () => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    const { container } = render(
      <Chip onRemove={onRemove} onClick={onClick}>
        Tag
      </Chip>,
    );
    const x = container.querySelector('svg');
    expect(x).not.toBeNull();
    if (x) await userEvent.click(x);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('WeOCard engages from its hero orb (the design has no separate button in card format)', async () => {
    const onEngage = vi.fn();
    render(<WeOCard name="Mug" engageLabel="Collect it" onEngage={onEngage} selected />);
    // the label pill is pointer-events:none; the click lands on the orb wrapper it sits in
    fireEvent.click(screen.getByText('Collect it'));
    expect(onEngage).toHaveBeenCalled();
  });

  it('ISR stages read Depleted → Pristine', () => {
    expect(isrStage(10).label).toBe('Depleted');
    expect(isrStage(60).label).toBe('Healthy');
    expect(isrStage(100).label).toBe('Pristine');
    expect(isrStage(140).label).toBe('Pristine');
  });

  it('O Power bands', () => {
    expect(oPowerStage(0.5).key).toBe('thin');
    expect(oPowerStage(1.3).key).toBe('strong');
    expect(oPowerStage(3).key).toBe('abundant');
  });
});
