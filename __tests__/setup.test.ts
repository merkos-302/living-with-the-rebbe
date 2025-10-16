describe('Project Setup Tests', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });

  it('should have test environment configured', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have mock environment variables', () => {
    // This is set in jest.setup.js
    expect(process.env.MOCK_ENV).toBe('test');
  });
});
