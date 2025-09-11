import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const success = await login(email, password);
    
    if (!success) {
      toast({
        title: "Erro de autenticação",
        description: "Email ou senha incorretos.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <style>
        {`
          .login-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #2c4156 0%, #39586d 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
          }
          
          .login-box {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            padding: 40px;
            width: 100%;
            max-width: 400px;
            position: relative;
            overflow: hidden;
          }
          
          .login-header {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .login-logo {
            width: 60px;
            height: 60px;
            background: #39586d;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 24px;
            color: white;
          }
          
          .login-title {
            font-size: 28px;
            font-weight: bold;
            color: #2c4156;
            margin: 0 0 8px;
            letter-spacing: -0.5px;
          }
          
          .login-subtitle {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }
          
          .login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          
          .input-label {
            font-size: 14px;
            font-weight: 500;
            color: #374151;
          }
          
          .input-wrapper {
            position: relative;
          }
          
          .input-field {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.2s ease;
            outline: none;
            box-sizing: border-box;
          }
          
          .input-field:focus {
            border-color: #39586d;
            box-shadow: 0 0 0 3px rgba(57, 88, 109, 0.1);
          }
          
          .input-field:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .password-field {
            padding-right: 50px;
          }
          
          .password-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            font-size: 14px;
            padding: 4px;
          }
          
          .login-button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #39586d, #7f99b2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 10px;
          }
          
          .login-button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 8px 25px rgba(57, 88, 109, 0.3);
          }
          
          .login-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }
          
          .test-accounts {
            margin-top: 25px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          
          .test-title {
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 12px;
          }
          
          .test-list {
            font-size: 12px;
            color: #64748b;
            line-height: 1.6;
          }
          
          .test-item {
            margin-bottom: 4px;
          }
          
          .test-strong {
            font-weight: 600;
            color: #374151;
          }
        `}
      </style>
      
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <div className="login-logo">💉</div>
            <h1 className="login-title">VixClinic</h1>
            <p className="login-subtitle">Sistema de Gestão de Vacinação</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="input-field"
              />
            </div>
            
            <div className="input-group">
              <label className="input-label" htmlFor="password">
                Senha
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="input-field password-field"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? '⏳ Entrando...' : '🚀 Entrar'}
            </button>
          </form>

          <div className="test-accounts">
            <p className="test-title">🔑 Contas de teste:</p>
            <div className="test-list">
              <div className="test-item">
                <span className="test-strong">Admin:</span> admin@vaxclinic.com
              </div>
              <div className="test-item">
                <span className="test-strong">Funcionário:</span> funcionario@vaxclinic.com
              </div>
              <div className="test-item">
                <span className="test-strong">Vacinador:</span> vacinador@vaxclinic.com
              </div>
              <div className="test-item">
                <span className="test-strong">Senha:</span> 123456
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};