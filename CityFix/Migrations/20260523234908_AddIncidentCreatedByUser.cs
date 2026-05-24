using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityFix.Migrations
{
    /// <inheritdoc />
    public partial class AddIncidentCreatedByUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Incidents",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_CreatedByUserId",
                table: "Incidents",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidents_Users_CreatedByUserId",
                table: "Incidents",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidents_Users_CreatedByUserId",
                table: "Incidents");

            migrationBuilder.DropIndex(
                name: "IX_Incidents_CreatedByUserId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Incidents");
        }
    }
}
