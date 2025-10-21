using AutoMapper;
using VixClinic.Application.DTOs;
using VixClinic.Application.Helpers;
using VixClinic.Core.Entities;

namespace VixClinic.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Cliente mappings
        CreateMap<Cliente, ClienteDto>()
            .ForMember(dest => dest.Cpf, opt => opt.MapFrom(src => CpfFormatter.Display(src.Cpf)))
            .ForMember(dest => dest.Telefone, opt => opt.MapFrom(src => TelefoneFormatter.Display(src.Telefone)));

        CreateMap<ClienteDto, Cliente>()
            .ForMember(dest => dest.Cpf, opt => opt.MapFrom(src => CpfFormatter.Format(src.Cpf!)))
            .ForMember(dest => dest.Telefone, opt => opt.MapFrom(src => TelefoneFormatter.Format(src.Telefone)))
            .ForMember(dest => dest.Agendamentos, opt => opt.Ignore())
            .ForMember(dest => dest.Aplicacoes, opt => opt.Ignore());

        // Funcionario mappings
        CreateMap<Funcionario, FuncionarioDto>()
            .ForMember(dest => dest.Cpf, opt => opt.MapFrom(src => CpfFormatter.Display(src.Cpf)))
            .ForMember(dest => dest.Telefone, opt => opt.MapFrom(src => TelefoneFormatter.Display(src.Telefone)))
            .ForMember(dest => dest.Senha, opt => opt.Ignore()); // Nunca retornar senha

        CreateMap<FuncionarioDto, Funcionario>()
            .ForMember(dest => dest.Cpf, opt => opt.MapFrom(src => CpfFormatter.Format(src.Cpf!)))
            .ForMember(dest => dest.Telefone, opt => opt.MapFrom(src => TelefoneFormatter.Format(src.Telefone)))
            .ForMember(dest => dest.Senha, opt => opt.Condition(src => !string.IsNullOrWhiteSpace(src.Senha)))
            .ForMember(dest => dest.Agendamentos, opt => opt.Ignore())
            .ForMember(dest => dest.Aplicacoes, opt => opt.Ignore());

        // Vacina mappings
        CreateMap<Vacina, VacinaDto>();
        CreateMap<VacinaDto, Vacina>()
            .ForMember(dest => dest.Lotes, opt => opt.Ignore());

        // Lote mappings
        CreateMap<Lote, LoteDto>();
        CreateMap<LoteDto, Lote>()
            .ForMember(dest => dest.Vacina, opt => opt.Ignore())
            .ForMember(dest => dest.Agendamentos, opt => opt.Ignore());

        // Agendamento mappings
        CreateMap<Agendamento, AgendamentoDto>();
        CreateMap<AgendamentoDto, Agendamento>()
            .ForMember(dest => dest.Cliente, opt => opt.Ignore())
            .ForMember(dest => dest.Funcionario, opt => opt.Ignore())
            .ForMember(dest => dest.Lote, opt => opt.Ignore())
            .ForMember(dest => dest.Aplicacoes, opt => opt.Ignore());

        // Aplicacao mappings
        CreateMap<Aplicacao, AplicacaoDto>();
        CreateMap<AplicacaoDto, Aplicacao>()
            .ForMember(dest => dest.Funcionario, opt => opt.Ignore())
            .ForMember(dest => dest.Cliente, opt => opt.Ignore())
            .ForMember(dest => dest.Agendamento, opt => opt.Ignore());
    }
}
