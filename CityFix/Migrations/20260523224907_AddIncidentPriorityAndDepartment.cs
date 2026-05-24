using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityFix.Migrations
{
    /// <inheritdoc />
    public partial class AddIncidentPriorityAndDepartment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Department",
                table: "Incidents",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PriorityLevel",
                table: "Incidents",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Department",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "PriorityLevel",
                table: "Incidents");
        }
    }
}
