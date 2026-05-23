using CityFix.Models;
using Microsoft.EntityFrameworkCore;

namespace CityFix.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Incident> Incidents => Set<Incident>();

    public DbSet<Municipality> Municipalities => Set<Municipality>();

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<AppUser> Users => Set<AppUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Incident>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(x => x.ImageUrl)
                .HasColumnType("nvarchar(max)");

            entity.HasOne(x => x.Municipality)
                .WithMany()
                .HasForeignKey(x => x.MunicipalityId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Category)
                .WithMany()
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Municipality>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Region)
                .HasMaxLength(150)
                .IsRequired();
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(500)
                .IsRequired();
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.FullName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasMaxLength(256)
                .IsRequired();

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.Property(x => x.PasswordHash)
                .HasMaxLength(500)
                .IsRequired();

            entity.HasOne(x => x.Municipality)
                .WithMany()
                .HasForeignKey(x => x.MunicipalityId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
